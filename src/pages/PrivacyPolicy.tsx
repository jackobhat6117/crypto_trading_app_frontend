import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

const LAST_UPDATED = new Date().toLocaleDateString('en-GB')

const listClass = 'mb-4 list-inside list-disc space-y-2 text-gray-700 dark:text-gray-300'
const paragraphClass = 'mb-4 text-gray-700 dark:text-gray-300'
const sectionTitleClass = 'mb-4 text-2xl font-bold text-gray-900 dark:text-white'
const subsectionTitleClass = 'mb-2 text-xl font-semibold text-gray-900 dark:text-white'

export default function PrivacyPolicy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: {LAST_UPDATED}</p>

          <section>
            <h2 className={sectionTitleClass}>1. Introduction</h2>
            <p className={paragraphClass}>
              Welcome to Base. We are committed to protecting your personal information and your right to
              privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our trading platform.
            </p>
          </section>

          <section>
            <h2 className={sectionTitleClass}>2. Information We Collect</h2>
            <h3 className={subsectionTitleClass}>2.1 Personal Information</h3>
            <p className={paragraphClass}>We collect information that you provide directly to us, including:</p>
            <ul className={listClass}>
              <li>Name, email address, phone number, and other contact information</li>
              <li>Government-issued identification documents for KYC verification</li>
              <li>Financial information, including bank account details and transaction history</li>
              <li>Authentication credentials (passwords, 2FA codes)</li>
            </ul>

            <h3 className={subsectionTitleClass}>2.2 Automatically Collected Information</h3>
            <p className={paragraphClass}>
              We automatically collect certain information when you use our platform:
            </p>
            <ul className={listClass}>
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Usage data (pages visited, features used, time spent)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className={sectionTitleClass}>3. How We Use Your Information</h2>
            <p className={paragraphClass}>We use the information we collect to:</p>
            <ul className={listClass}>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and manage your account</li>
              <li>Verify your identity and comply with legal obligations</li>
              <li>Send you important updates and notifications</li>
              <li>Detect and prevent fraud, abuse, and security threats</li>
              <li>Personalize your experience on our platform</li>
            </ul>
          </section>

          <section>
            <h2 className={sectionTitleClass}>4. Information Sharing and Disclosure</h2>
            <p className={paragraphClass}>
              We do not sell your personal information. We may share your information only in the following
              circumstances:
            </p>
            <ul className={listClass}>
              <li>With service providers who assist us in operating our platform</li>
              <li>To comply with legal obligations or respond to legal requests</li>
              <li>To protect our rights, property, or safety, or that of our users</li>
              <li>In connection with a business transfer or merger</li>
              <li>With your explicit consent</li>
            </ul>
          </section>

          <section>
            <h2 className={sectionTitleClass}>5. Data Security</h2>
            <p className={paragraphClass}>
              We implement industry-standard security measures to protect your information, including:
            </p>
            <ul className={listClass}>
              <li>Encryption of sensitive data in transit and at rest</li>
              <li>Secure authentication and authorization mechanisms</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and employee training</li>
            </ul>
          </section>

          <section>
            <h2 className={sectionTitleClass}>6. Your Rights</h2>
            <p className={paragraphClass}>You have the right to:</p>
            <ul className={listClass}>
              <li>Access and receive a copy of your personal information</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to processing of your personal information</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className={sectionTitleClass}>7. Cookies and Tracking Technologies</h2>
            <p className={paragraphClass}>
              We use cookies and similar technologies to enhance your experience, analyze usage, and assist
              with marketing efforts. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className={sectionTitleClass}>8. Data Retention</h2>
            <p className={paragraphClass}>
              We retain your personal information for as long as necessary to fulfill the purposes outlined in
              this Privacy Policy, unless a longer retention period is required or permitted by law.
            </p>
          </section>

          <section>
            <h2 className={sectionTitleClass}>9. International Data Transfers</h2>
            <p className={paragraphClass}>
              Your information may be transferred to and processed in countries other than your country of
              residence. We ensure appropriate safeguards are in place to protect your information.
            </p>
          </section>

          <section>
            <h2 className={sectionTitleClass}>10. Children&apos;s Privacy</h2>
            <p className={paragraphClass}>
              Our platform is not intended for individuals under the age of 18. We do not knowingly collect
              personal information from children.
            </p>
          </section>

          <section>
            <h2 className={sectionTitleClass}>11. Changes to This Privacy Policy</h2>
            <p className={paragraphClass}>
              We may update this Privacy Policy from time to time. We will notify you of any changes by
              posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className={sectionTitleClass}>12. Contact Us</h2>
            <p className={paragraphClass}>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
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
