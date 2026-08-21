import { Link } from 'react-router-dom'

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: '1. Introduction',
    body: [
      'This Privacy Policy explains how we collect, use, disclose and safeguard your information when you use our exchange platform. By accessing the platform you agree to the practices described here.',
    ],
  },
  {
    title: '2. Information We Collect',
    body: [
      'Account information such as your name, email address, phone number and date of birth.',
      'Identity verification records, including government-issued documents and selfies submitted for KYC.',
      'Authentication credentials (passwords, 2FA codes) stored in hashed or encrypted form.',
      'Transaction data covering deposits, withdrawals, transfers and trades.',
      'Technical data such as IP address, device identifiers, browser type and usage logs.',
    ],
  },
  {
    title: '3. How We Use Your Information',
    body: [
      'To create and administer your account, process transactions, and provide customer support.',
      'To verify your identity and comply with anti-money-laundering and counter-terrorist-financing obligations.',
      'To detect, investigate and prevent fraud, unauthorised access and other prohibited activity.',
      'To send service notices, security alerts and, where you have opted in, product updates.',
    ],
  },
  {
    title: '4. Information Sharing and Disclosure',
    body: [
      'We do not sell your personal information. We share it only with identity-verification and payment providers acting on our behalf, with regulators and law enforcement where legally required, and with professional advisers under duties of confidentiality.',
    ],
  },
  {
    title: '5. Data Security',
    body: [
      'We apply encryption in transit and at rest, cold storage for the majority of customer crypto assets, secure authentication and authorization mechanisms, and regular independent security audits. No system is completely secure, so please protect your credentials and enable two-factor authentication.',
    ],
  },
  {
    title: '6. Your Rights',
    body: [
      'Depending on your jurisdiction you may request access to, correction of, or deletion of your personal data, object to certain processing, request a portable copy of your data, and withdraw consent at any time. Some data must be retained to meet regulatory obligations.',
    ],
  },
  {
    title: '7. Cookies and Tracking Technologies',
    body: [
      'We use strictly necessary cookies to keep you signed in and to remember preferences such as theme and language, plus analytics cookies to understand how the platform is used. You can control cookies through your browser settings.',
    ],
  },
  {
    title: '8. Data Retention',
    body: [
      'We retain account and transaction records for as long as your account is open and for the period afterwards required by applicable financial regulations, typically five to seven years. Data no longer required is deleted or irreversibly anonymised.',
    ],
  },
  {
    title: '9. International Data Transfers',
    body: [
      'Your information may be processed in countries other than your own. Where we transfer data across borders we rely on recognised safeguards such as standard contractual clauses to ensure an equivalent level of protection.',
    ],
  },
  {
    title: "10. Children's Privacy",
    body: [
      'The platform is not intended for anyone under 18. We do not knowingly collect information from children. If you believe a minor has provided us data, contact us and we will delete it.',
    ],
  },
  {
    title: '11. Changes to This Privacy Policy',
    body: [
      'We may update this policy from time to time. Material changes will be announced in the app or by email before they take effect. The date below reflects the most recent revision.',
    ],
  },
]

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link to="/" className="text-sm text-indigo-600">
          ← Back to home
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-1 text-sm text-gray-500">
          Last updated{' '}
          {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="mt-8 space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="mb-4 text-xl font-bold">{section.title}</h2>
              {section.body.length > 1 ? (
                <ul className="space-y-2">
                  {section.body.map((line) => (
                    <li key={line} className="flex gap-2 text-gray-700 dark:text-gray-300">
                      <span className="text-indigo-500">•</span>
                      {line}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700 dark:text-gray-300">{section.body[0]}</p>
              )}
            </section>
          ))}

          <section>
            <h2 className="mb-4 text-xl font-bold">12. Contact Us</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Email:</strong> support@basetradedex.com
                <br />
                <strong>Support:</strong> support@basetradedex.com
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
