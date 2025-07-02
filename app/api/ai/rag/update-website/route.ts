import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { HtmlToTextTransformer } from '@langchain/community/document_transformers/html_to_text';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

		const { error } = await supabase
			.from('documents')
			.delete()
			.eq('user_id', user.id)
			.eq('doc_type', 'webpage')
			.ilike('id', `${url}%`);

		if (error) {
			return NextResponse.json({ error: 'Error deleting website' }, { status: 500 });
		}

        const embeddings = new OpenAIEmbeddings({
            model: 'text-embedding-ada-002'
        })

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        })
        
        const vectorStore = new SupabaseVectorStore(embeddings, {
            client: supabase,
            tableName: 'documents',
            queryName: 'match_documents',
        })

		const res = await fetch(`https://production-sfo.browserless.io/export?token=${process.env.BROWSERLESS_API_KEY}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				url,
				gotoOptions: { waitUntil: 'networkidle2', timeout: 30000 },
				waitForTimeout: 1000, // wait 1 second
				bestAttempt: true
			})
		})

		const html = await res.text();

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
		const textDocs = await transformer.transformDocuments([new Document({ pageContent: html })]);

		const chunks = await splitter.splitDocuments(textDocs);

        const chunksWithUser = chunks.map((doc) => ({
            ...doc,
            metadata: {
              ...doc.metadata,
              user_id: user.id,
			  doc_type: 'webpage',
			  source: url,
            },
          }));
          
          await vectorStore.addDocuments(chunksWithUser, {
            ids: chunksWithUser.map((_, i) => `${url} ||| ${i}`),
          });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}