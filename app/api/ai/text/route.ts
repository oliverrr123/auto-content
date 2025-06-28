import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
// import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import 'cheerio';
// import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
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
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
// import { HTMLWebBaseLoader } from '@langchain/community/document_loaders/web/html';
import { PuppeteerWebBaseLoader } from '@langchain/community/document_loaders/web/puppeteer';
import { HtmlToTextTransformer } from '@langchain/community/document_transformers/html_to_text';

const retrieveSchema = z.object({ query: z.string() });

const llm = new ChatOpenAI({
	model: 'gpt-4o-mini',
	temperature: 0
})

const embeddings = new OpenAIEmbeddings({
	model: 'text-embedding-ada-002'
})

// const vectorStore = new MemoryVectorStore(embeddings);

export async function POST(req: Request) {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { messages } = await req.json();



		// const cheerioLoader = new CheerioWebBaseLoader(
		// 	'https://olivercingl.com/',
		// 	// {
		// 	// 	selector: 'article,section,footer,nav,aside,h1,h2,h3,h4,h5,h6,p,blockquote,pre,code,ul,ol,li,table,thead,tbody,tfoot,tr,th,td,figure,figcaption,img,picture,video,audio,source,details,summary,mark,em,strong,small,sub,sup,abbr,time,address,aside,cite,dfn,kbd,samp,var'
		// 	// }
		// );

		// const docs = await cheerioLoader.load();

		// console.log('--- docs ---')
		// console.log(docs)
		// console.log('--- docs ---')

		// const newDocs = [new Document({
		// 	pageContent: '',
		// 	metadata: {
		// 		source: 'olivercingl.com',
		// 		title: 'Oliver Cingl',
		// 	},
		// 	id: undefined
		// })]

		// console.assert(docs.length === 1);

		const splitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 200,
		})

		// const url = 'https://sazimecesko.cz/';
		// const loader = new HTMLWebBaseLoader(url);
		// const transformer = new MozillaReadabilityTransformer();

		// const docs = await loader.load();
		// const sequence = transformer.pipe(splitter);
		// const documents = await sequence.invoke(docs);

		// const allSplits = await splitter.splitDocuments(docs);

		const vectorStore = new SupabaseVectorStore(embeddings, {
			client: supabase,
			tableName: 'documents',
			queryName: 'match_documents',
		})

		const url = 'https://sazimecesko.cz/';
		const loader = new PuppeteerWebBaseLoader(url, {
			launchOptions: { headless: 'new', args: ['--no-sandbox'] }
		})
		const htmlDocs = await loader.load();

		const transformer = new HtmlToTextTransformer();
		const textDocs = await transformer.transformDocuments(htmlDocs);

		const chunks = await splitter.splitDocuments(textDocs);

		// const allSplits = await splitter.splitDocuments(docs);

		await vectorStore.addDocuments(chunks, { ids: Array.from({ length: chunks.length }, (_, i) => i) });

		// await vectorStore.addDocuments(allSplits, { ids: Array.from({ length: allSplits.length }, (_, i) => i) });

		// await vectorStore.addDocuments(documents, { ids: Array.from({ length: documents.length }, (_, i) => i) });

		const retrieve = tool(
			async ({ query }) => {
				console.log(`query: ${query}`);
				const retrievedDocs = await vectorStore.similaritySearch(query, 2);
				const serialized = retrievedDocs.map((doc) => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`)
				console.log(serialized);
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

			const conversationalMessages = state.messages.filter((message) => message instanceof HumanMessage || (message instanceof AIMessage && message.tool_calls?.length == 0) || message instanceof SystemMessage);
			const prompt = [new SystemMessage(systemMessageContent), ...conversationalMessages];

			const response = await llm.invoke(prompt);
			return { messages: [response] };
		}

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

		// const agent = createReactAgent({ llm: llm, tools: [retrieve] });

		let inputs = { messages: messages };

		// const prettyPrint = (message: BaseMessage) => {
		// 	let txt = `[${message._getType()}]: ${message.content}`;
		// 	if ((isAIMessage(message) && message.tool_calls?.length) || 0 > 0) {
		// 	  const tool_calls = (message as AIMessage)?.tool_calls
		// 		?.map((tc) => `- ${tc.name}(${JSON.stringify(tc.args)})`)
		// 		.join("\n");
		// 	  txt += ` \nTools: \n${tool_calls}`;
		// 	}
		// 	console.log(txt);
		//   };


		// for await (const step of await agent.stream(inputs, { streamMode: 'values' })) {
		// 	const lastMessage = step.messages[step.messages.length - 1];
		// 	prettyPrint(lastMessage);
		// 	console.log('-------\n')
		// }
		
		const result = await graph.invoke(inputs);

		// await vectorStore.delete({ ids: Array.from({ length: documents.length }, (_, i) => i) });
		
		return NextResponse.json({ content: result['messages'][result['messages'].length - 1].content });
		// return NextResponse.json({ content: 'test' });
	} catch (error) {
		console.error('Error processing OpenAI response:', error);
		return NextResponse.json({ error: 'Error processing AI response' }, { status: 500 });
	}
}
