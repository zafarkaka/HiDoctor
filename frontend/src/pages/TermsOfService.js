import React from 'react';
import { Navbar, Footer } from '../components/Layout';
import { motion } from 'framer-motion';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
            <p className="text-sm italic">Last Updated: March 22, 2026</p>
            
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Agreement to Terms</h2>
              <p>
                By accessing HiDoctor, you agree to be bound by these Terms of Service. If you do not agree, 
                please do not use the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Medical Disclaimer</h2>
              <p className="font-bold text-slate-900">
                HiDoctor is a platform for connecting patients and doctors. We do not provide medical advice 
                directly. In case of a medical emergency, call your local emergency services immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. User Responsibilities</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and password and for 
                restricting access to your computer or device.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Prohibited Activities</h2>
              <p>
                You may not use our service for any illegal or unauthorized purpose. You must not, in the use 
                of the service, violate any laws in your jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Termination</h2>
              <p>
                We reserve the right to terminate or suspend your account at our sole discretion, without notice, 
                for conduct that we believe violates these Terms of Service or is harmful to other users of the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Limitation of Liability</h2>
              <p>
                HiDoctor shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
                including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
            </section>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
