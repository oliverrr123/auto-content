import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import 'cheerio';
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
// import { pull } from 'langchain/hub';
// import { ChatPromptTemplate } from '@langchain/core/prompts';
// import { Document } from '@langchain/core/documents';
// import { Annotation, StateGraph, MessagesAnnotation } from '@langchain/langgraph';
import { StateGraph, MessagesAnnotation } from '@langchain/langgraph';
import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { ToolNode, toolsCondition } from '@langchain/langgraph/prebuilt';
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';

const retrieveSchema = z.object({ query: z.string() });

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
		const pTagSelector = 'p,h1,h2,h3,h4,h5,h6,li,ul,ol,a,img,blockquote,cite,code,tr,td,th';
		const cheerioLoader = new CheerioWebBaseLoader(
			'https://olivercingl.com/',
			{ selector: pTagSelector }
		);

		const docs = await cheerioLoader.load();

		console.assert(docs.length === 1);
		// console.log(`Total characters: ${docs[0].pageContent.length}`);
		// console.log(docs[0].pageContent.slice(0, 500));

		const splitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 200,
		})
		const allSplits = await splitter.splitDocuments(docs);
		// console.log(`Split blog post into ${allSplits.length} sub-documents.`)

		await vectorStore.addDocuments(allSplits);

		// const promptTemplate = await pull<ChatPromptTemplate>('rlm/rag-prompt');

		// const InputStateAnnotation = Annotation.Root({
		// 	question: Annotation<string>,
		// });

		// const StateAnnotation = Annotation.Root({
		// 	question: Annotation<string>,
		// 	context: Annotation<Document[]>,
		// 	answer: Annotation<string>,
		// });

		// const retrieve = async (state: typeof InputStateAnnotation.State) => {
		// 	const retrievedDocs = await vectorStore.similaritySearch(state.question);
		// 	return { context: retrievedDocs };
		// }

		const retrieve = tool(
			async ({ query }) => {
				console.log(`query: ${query}`);
				const retrievedDocs = await vectorStore.similaritySearch(query, 2);
				const serialized = retrievedDocs.map((doc) => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`)
				return [serialized, retrievedDocs]
			},
			{
				name: 'retrieve',
				description: 'Retrieve information related to a query',
				schema: retrieveSchema,
				responseFormat: 'content_and_artifacts'
			}
		)

		const queryOrRespond = async (state: typeof MessagesAnnotation.State) => {
			const llmWithTools = llm.bindTools([retrieve]);
			const response = await llmWithTools.invoke(state.messages);
			return { messages: [response] };
		}

		const tools = new ToolNode([retrieve]);

		// const generate = async (state: typeof StateAnnotation.State) => {
		// 	const docsContent = state.context.map((doc) => doc.pageContent).join('\n');
		// 	const messages = await promptTemplate.invoke({
		// 		question: state.question,
		// 		context: docsContent,
		// 	})
		// 	const response = await llm.invoke(messages);
		// 	return { answer: response.content };
		// }

		const generate = async (state: typeof MessagesAnnotation.State) => {
			const recentToolMessages = [];
			for (let i = state['messages'].length -1; i >= 0; i--) {
				const message = state['messages'][i];
				if (message instanceof ToolMessage) {
					recentToolMessages.push(message);
				} else {
					break;
				}
			}
			let toolMessages = recentToolMessages.reverse();

			const docsContent = toolMessages.map((doc) => doc.content).join('\n');
			const systemMessageContent = `You are Grow, a helpful assistant that can answer questions about the user's website. You have access to the following information: ${docsContent}`;

			console.log(systemMessageContent);

			const conversationalMessages = state.messages.filter((message) => message instanceof HumanMessage || (message instanceof AIMessage && message.tool_calls?.length == 0) || message instanceof SystemMessage);
			const prompt = [new SystemMessage(systemMessageContent), ...conversationalMessages];

			const response = await llm.invoke(prompt);
			return { messages: [response] };
		}

		// const graph = new StateGraph(MessagesAnnotation)
		// 	.addNode('retrieve', retrieve)
		// 	.addNode('generate', generate)
		// 	.addEdge('__start__', 'retrieve')
		// 	.addEdge('retrieve', 'generate')
		// 	.addEdge('generate', '__end__')
		// 	.compile();

		const graphBuilder = new StateGraph(MessagesAnnotation)
			.addNode('queryOrRespond', queryOrRespond)
			.addNode('tools', tools)
			.addNode('generate', generate)
			.addEdge('__start__', 'queryOrRespond')
			.addConditionalEdges('queryOrRespond', toolsCondition, {
				__end__: '__end__',
				tools: 'tools',
			})
			.addEdge('tools', 'generate')
			.addEdge('generate', '__end__')

		const graph = graphBuilder.compile();

		// let inputs = { question: messages[messages.length - 1].content };

		let inputs = { messages: messages };

		const result = await graph.invoke(inputs);
		// console.log(result.context.slice(0, 2));
		// console.log(`\nAnswer: ${result['answer']}`);

		// return NextResponse.json({ content: result['answer'] });
		return NextResponse.json({ content: result['messages'][result['messages'].length - 1].content });
	} catch (error) {
		console.error('Error processing OpenAI response:', error);
		return NextResponse.json({ error: 'Error processing AI response' }, { status: 500 });
	}
}
