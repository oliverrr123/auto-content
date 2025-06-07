export default function PrivacyPolicy() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
            
            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                <p className="mb-4">
                    Welcome to AutoContent. We respect your privacy and are committed to protecting your personal data.
                    This privacy policy will inform you about how we look after your personal data when you visit our website
                    and tell you about your privacy rights and how the law protects you.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Data We Collect</h2>
                <p className="mb-4">We may collect, use, store and transfer different kinds of personal data about you, including:</p>
                <ul className="list-disc pl-6 mb-4">
                    <li>Identity Data (name, username)</li>
                    <li>Contact Data (email address)</li>
                    <li>Technical Data (IP address, browser type and version, time zone setting)</li>
                    <li>Usage Data (information about how you use our website and services)</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Data</h2>
                <p className="mb-4">We use your data to:</p>
                <ul className="list-disc pl-6 mb-4">
                    <li>Provide and maintain our services</li>
                    <li>Notify you about changes to our services</li>
                    <li>Provide customer support</li>
                    <li>Monitor the usage of our services</li>
                    <li>Detect, prevent and address technical issues</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
                <p className="mb-4">
                    We have implemented appropriate security measures to prevent your personal data from being accidentally lost,
                    used, or accessed in an unauthorized way, altered, or disclosed. We limit access to your personal data to
                    those employees, agents, contractors, and other third parties who have a business need to know.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
                <p className="mb-4">Under certain circumstances, you have rights under data protection laws in relation to your personal data, including:</p>
                <ul className="list-disc pl-6 mb-4">
                    <li>The right to access your personal data</li>
                    <li>The right to request correction of your personal data</li>
                    <li>The right to request erasure of your personal data</li>
                    <li>The right to withdraw consent</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
                <p className="mb-4">
                    If you have any questions about this privacy policy or our privacy practices, please contact us at:
                    <br />
                    Email: privacy@autocontent.com
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Changes to This Policy</h2>
                <p className="mb-4">
                    We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
                    Privacy Policy on this page and updating the &quot;last updated&quot; date at the top of this Privacy Policy.
                </p>
            </section>

            <footer className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleDateString()}
            </footer>
        </div>
    );
}