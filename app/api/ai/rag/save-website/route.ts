import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { HtmlToTextTransformer } from '@langchain/community/document_transformers/html_to_text';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';

// Basic URL validator (mirrors client logic)
function isValidUrl(raw: string): boolean {
  if (!raw) return false;
  let formatted = raw.trim();
  if (!/^https?:\/\//i.test(formatted)) {
    formatted = `https://${formatted}`;
  }
  try {
    const { hostname } = new URL(formatted);
    if (!hostname || hostname.startsWith('.') || hostname.endsWith('.')) return false;
    const pieces = hostname.split('.');
    if (pieces.length < 2) return false;
    const tld = pieces[pieces.length - 1];
    return tld.length >= 2;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        let formattedUrl = url.trim();
        if (!/^https?:\/\//i.test(formattedUrl)) {
          formattedUrl = `https://${formattedUrl}`;
        }

        if (!isValidUrl(formattedUrl)) {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

		const res = await fetch(
			`https://production-sfo.browserless.io/export?token=${process.env.BROWSERLESS_API_KEY}`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					url: formattedUrl,
					gotoOptions: { waitUntil: 'networkidle2', timeout: 30000 },
					waitForTimeout: 1000, // wait 1 second
					bestAttempt: true
				})
			}
		)

		if (!res.ok) {
			console.error(res);
			return NextResponse.json({ error: 'Failed to fetch website' }, { status: 500 });
		}

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