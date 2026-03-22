import React from "react";
import { Navbar, Footer } from "../components/Layout";
import { Mail, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="mb-8">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
        </div>

        <div className="glass-premium rounded-3xl p-8 md:p-12 border border-white/20 shadow-xl overflow-hidden relative">
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>

            <h1 className="text-4xl font-bold font-outfit mb-6">Account Deletion & Data Privacy</h1>
            
            <div className="prose prose-slate max-w-none mb-10">
              <p className="text-xl text-muted-foreground leading-relaxed">
                We value your privacy. If you wish to delete your HiDoctor account or request the removal of specific personal data, we are here to help.
              </p>
              
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 my-8">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  How it works:
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    Send an email from your registered email address to our support team.
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    Include your full name and the phone number associated with your account.
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    Our team will verify your identity and process the deletion within 2-3 business days.
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <a href="mailto:support@hidoctor.app" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white rounded-full px-8 py-6 h-auto text-lg flex items-center gap-2 shadow-lg shadow-red-500/20 active:scale-95 transition-all">
                  <Mail className="w-5 h-5" />
                  Contact Support to Delete
                </Button>
              </a>
              <p className="text-sm text-muted-foreground">
                or email us at <span className="font-semibold text-foreground">support@hidoctor.app</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactPage;
