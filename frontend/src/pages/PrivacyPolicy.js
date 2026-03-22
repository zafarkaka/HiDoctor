import React from 'react';
import { Navbar, Footer } from '../components/Layout';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
            <p className="text-sm italic">Last Updated: March 22, 2026</p>
            
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Introduction</h2>
              <p>
                Welcome to HiDoctor. We are committed to protecting your personal information and your right to privacy. 
                If you have any questions or concerns about our policy, or our practices with regards to your personal information, 
                please contact us at support@hidoctor.app.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Information We Collect</h2>
              <p>
                We collect personal information that you voluntarily provide to us when you register on the App or Website, 
                express an interest in obtaining information about us or our products and services, when you participate in 
                activities on the App or otherwise when you contact us.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Personal Data: Name, phone number, email address, password, and profile picture.</li>
                <li>Medical Data: Appointment history, consultation notes (encrypted), and health records you upload.</li>
                <li>Device Data: IP address, device ID, and usage patterns.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. How We Use Your Information</h2>
              <p>
                We use personal information collected via our App for a variety of business purposes described below:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>To facilitate account creation and logon process.</li>
                <li>To send you administrative information.</li>
                <li>To fulfill and manage your appointments.</li>
                <li>To enable user-to-user communications (Doctor to Patient).</li>
                <li>To deliver targeted advertising (if opted in).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Sharing Your Information</h2>
              <p>
                We only share information with your consent, to comply with laws, to provide you with services, 
                to protect your rights, or to fulfill business obligations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational security measures designed to protect the security 
                of any personal information we process. However, please also remember that we cannot guarantee that the 
                internet itself is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Your Privacy Rights</h2>
              <p>
                In some regions, such as the European Economic Area (EEA), you have rights that allow you greater 
                access to and control over your personal information. You may review, change, or terminate your 
                account at any time.
              </p>
            </section>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
