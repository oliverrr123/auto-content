import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import 'cheerio';
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { pull } from 'langchain/hub';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Document } from '@langchain/core/documents';
import { Annotation, StateGraph } from '@langchain/langgraph';


const llm = new ChatOpenAI({
	model: 'gpt-4o-mini',
	temperature: 0
})

const embeddings = new OpenAIEmbeddings({
	model: 'text-embedding-3-large'
})

const vectorStore = new MemoryVectorStore(embeddings);

export async function POST(req: Request) {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { messages } = await req.json();
		// const pTagSelector = 'p,h1,h2,h3,h4,h5,h6,li,ul,ol,a,img,blockquote,cite,code,tr,td,th';
		const cheerioLoader = new CheerioWebBaseLoader(
			'https://olivercingl.com/',
			// { selector: pTagSelector }
		);

		const docs = await cheerioLoader.load();

		console.assert(docs.length === 1);
		console.log(`Total characters: ${docs[0].pageContent.length}`);
		console.log(docs[0].pageContent.slice(0, 500));

		const splitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 200,
		})
		const allSplits = await splitter.splitDocuments(docs);
		console.log(`Split blog post into ${allSplits.length} sub-documents.`)

		await vectorStore.addDocuments(allSplits);

		const promptTemplate = await pull<ChatPromptTemplate>('rlm/rag-prompt');

		const InputStateAnnotation = Annotation.Root({
			question: Annotation<string>,
		});

		const StateAnnotation = Annotation.Root({
			question: Annotation<string>,
			context: Annotation<Document[]>,
			answer: Annotation<string>,
		});

		const retrieve = async (state: typeof InputStateAnnotation.State) => {
			const retrievedDocs = await vectorStore.similaritySearch(state.question);
			return { context: retrievedDocs };
		}

		const generate = async (state: typeof StateAnnotation.State) => {
			const docsContent = state.context.map((doc) => doc.pageContent).join('\n');
			const messages = await promptTemplate.invoke({
				question: state.question,
				context: docsContent,
			})
			const response = await llm.invoke(messages);
			return { answer: response.content };
		}

		const graph = new StateGraph(StateAnnotation)
			.addNode('retrieve', retrieve)
			.addNode('generate', generate)
			.addEdge('__start__', 'retrieve')
			.addEdge('retrieve', 'generate')
			.addEdge('generate', '__end__')
			.compile();

		let inputs = { question: messages[messages.length - 1].content };

		const result = await graph.invoke(inputs);
		console.log(result.context.slice(0, 2));
		console.log(`\nAnswer: ${result['answer']}`);

		return NextResponse.json({ content: result['answer'] });
	} catch (error) {
		console.error('Error processing OpenAI response:', error);
		return NextResponse.json({ error: 'Error processing AI response' }, { status: 500 });
	}
}
