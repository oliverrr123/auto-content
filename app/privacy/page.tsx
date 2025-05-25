export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
          <p className="text-gray-600">
            This Privacy Policy describes how we collect, use, and handle your information when you use our services.
            We take your privacy seriously and are committed to protecting your personal information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <p className="text-gray-600 mb-4">
            We collect information that you provide directly to us when you:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Create an account</li>
            <li>Connect your social media accounts (Instagram, Facebook)</li>
            <li>Use our services</li>
            <li>Contact us for support</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <p className="text-gray-600 mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Provide and maintain our services</li>
            <li>Process your social media connections</li>
            <li>Send you important updates and notifications</li>
            <li>Improve our services</li>
            <li>Respond to your requests and support needs</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Data Storage and Security</h2>
          <p className="text-gray-600">
            We implement appropriate security measures to protect your personal information.
            Your data is stored securely using industry-standard encryption and security practices.
            We do not sell your personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
          <p className="text-gray-600">
            Our service integrates with third-party platforms like Instagram and Facebook.
            When you connect these services, their privacy policies will also apply to the
            information collected through their platforms. We encourage you to review their
            privacy policies.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
          <p className="text-gray-600 mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Disconnect social media accounts</li>
            <li>Opt-out of marketing communications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-gray-600">
            If you have any questions about this Privacy Policy or our practices,
            please contact us at [Your Contact Email].
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
          <p className="text-gray-600">
            We may update this Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the "Last Updated" date.
          </p>
        </section>

        <footer className="text-sm text-gray-500 pt-8">
          Last Updated: {new Date().toLocaleDateString()}
        </footer>
      </div>
    </div>
  );
} 