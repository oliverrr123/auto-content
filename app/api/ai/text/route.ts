import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { StateGraph, MessagesAnnotation } from '@langchain/langgraph';
import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { ToolNode, toolsCondition } from '@langchain/langgraph/prebuilt';
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import type { SupabaseFilterRPCCall } from "@langchain/community/vectorstores/supabase";

const docTypes = ['webpage', 'pdf', 'pptx', 'word', 'instagram_post', 'instagram_profile'] as const;
const retrieveSchema = z.object({ query: z.string(), doc_type: z.enum(docTypes).optional() });

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
		
		const systemMessageBase = 'Your name is Grow, you are a helpful assistant that can answer questions about the user\'s Instagram account and website. You are also a great writer and can help the user with their Instagram posts. When you will be asked for example: "Create a new post about ___", you should create a new post for the user\'s Instagram account in their writing style. When you get asked questions like these, you should retrieve the context from the vector database. You can also retrieve information about the user\'s Instagram profile so you can see the bio, or the information from their website where there should be more information about them so you can get a better understanding of the user. If you\'re generating a new post, generate it in the same language as the user\'s other posts, not in the language the user speaks to you, or if you are unsure, ask which language the user prefers.';

		const vectorStore = new SupabaseVectorStore(embeddings, {
			client: supabase,
			tableName: 'documents',
			queryName: 'match_documents',
		})
		
		const retrieve = tool(
			async ({ query, doc_type }) => {
				try {
					console.log(`query: ${query}`);
					console.log(`doc_type: ${doc_type}`);
					const base: SupabaseFilterRPCCall = (rpc) => rpc.eq("user_id", user.id);
					const filter: SupabaseFilterRPCCall = doc_type ? (rpc) => base(rpc).eq("doc_type", doc_type) : base;
					const retrievedDocs = await vectorStore.similaritySearch(query, 3, filter);
					const serialized = retrievedDocs.map((doc) => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`)
					console.log('--------------------------------');
					console.log(retrievedDocs);
					console.log('--------------------------------');
					return [serialized, retrievedDocs]
				} catch (error) {
					console.error('Error retrieving documents:', error);
					return ['Error retrieving documents', []];
				}
			},
			{
				name: 'retrieve',
				description: `Retrieve information related to a query. Optionally restrict to a doc_type (${docTypes.join(", ")}).`,
				schema: retrieveSchema,
				responseFormat: 'content_and_artifacts'
			}
		)

		const queryOrRespond = async (state: typeof MessagesAnnotation.State) => {
			const llmWithTools = llm.bindTools([retrieve]);
			const response = await llmWithTools.invoke([systemMessageBase, ...state.messages]);
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
			const toolMessages = recentToolMessages.reverse();

			const docsContent = toolMessages.map((doc) => doc.content).join('\n');
			const systemMessageContent = `${systemMessageBase} You have access to the following information about the user's website and Instagram account: ${docsContent}`;

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

		const inputs = { messages: messages };

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
	} catch (error) {
		console.error('Error processing OpenAI response:', error);
		return NextResponse.json({ error: 'Error processing AI response' }, { status: 500 });
	}
}
