import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
// import { MemoryVectorStore } from 'langchain/vectorstores/memory';
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
import { PuppeteerWebBaseLoader } from '@langchain/community/document_loaders/web/puppeteer';
import { HtmlToTextTransformer } from '@langchain/community/document_transformers/html_to_text';
import { time } from 'console';

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

		const splitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 200,
		})

		const vectorStore = new SupabaseVectorStore(embeddings, {
			client: supabase,
			tableName: 'documents',
			queryName: 'match_documents',
		})

		const url = 'https://atollon.com/';
		const loader = new PuppeteerWebBaseLoader(url, {
			launchOptions: { headless: 'new', args: ['--no-sandbox'] },
			async evaluate(page) {
				await new Promise(resolve => setTimeout(resolve, 1000));
				return page.content();
			}
		})
		const htmlDocs = await loader.load();

		const transformer = new HtmlToTextTransformer({
			selectors: [
				{ selector: 'img', format: 'skip' },
				{ selector: 'picture', format: 'skip' },
				{ selector: 'figure', format: 'skip' },
				{ selector: 'video', format: 'skip' },
				{ selector: 'audio', format: 'skip' },
				{ selector: 'iframe', format: 'skip' },
				{ selector: 'script', format: 'skip' },
				{ selector: 'style', format: 'skip' },
				{ selector: 'link', format: 'skip' },
				{ selector: 'meta', format: 'skip' },
				{ selector: 'svg', format: 'skip' },
				{ selector: 'path', format: 'skip' },
				{ selector: 'polygon', format: 'skip' },
				{ selector: 'circle', format: 'skip' },
				{ selector: 'ellipse', format: 'skip' },
				{ selector: 'rect', format: 'skip' },
				{ selector: 'a', format: 'skip' },
				{ selector: 'button', format: 'skip' },
				{ selector: 'input', format: 'skip' },
				{ selector: 'textarea', format: 'skip' },
				{ selector: 'select', format: 'skip' },
				{ selector: 'option', format: 'skip' },
				{ selector: 'optgroup', format: 'skip' },
				{ selector: 'fieldset', format: 'skip' },
			]
		});
		const textDocs = await transformer.transformDocuments(htmlDocs);

		const chunks = await splitter.splitDocuments(textDocs);

		
		await vectorStore.addDocuments(chunks, { ids: Array.from({ length: chunks.length }, (_, i) => i) });
		
		// const allSplits = await splitter.splitDocuments(docs);
		// const allSplits = await splitter.splitDocuments(docs);
		// await vectorStore.addDocuments(allSplits, { ids: Array.from({ length: allSplits.length }, (_, i) => i) });

		const retrieve = tool(
			async ({ query }) => {
				console.log(`query: ${query}`);
				const retrievedDocs = await vectorStore.similaritySearch(query, 4);
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
