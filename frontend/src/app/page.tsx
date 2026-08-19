'use client';

import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/sections/HeroSection';
import TrustBadgesSection from '@/components/sections/TrustBadgesSection';
import FeaturesSection from '@/components/sections/FeaturesSection';
import FinalCTASection from '@/components/sections/FinalCTASection';

export default function Home() {
  const pricingTiers = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      desc: 'Essential secure cloud storage for personal use.',
      storage: '10 GB Secure Storage',
      features: ['Private Security Vault', 'Public Link Sharing', '100MB Max File Size', 'Standard Support'],
      cta: 'Get Started Free',
      popular: false,
      href: '/register',
    },
    {
      name: 'Pro',
      price: '$9',
      period: 'per month',
      desc: 'Advanced privacy, increased capacity & collaboration.',
      storage: '1 TB (1,000 GB) Storage',
      features: [
        'Everything in Free',
        'Custom Vault Auto-Lock Timeouts',
        'Direct User-to-User Sharing & RBAC',
        '10GB Max File Size',
        'Priority 24/7 Support',
      ],
      cta: 'Start 14-Day Free Trial',
      popular: true,
      href: '/register?plan=pro',
    },
    {
      name: 'Enterprise',
      price: '$29',
      period: 'per seat / month',
      desc: 'Maximum compliance, dedicated infrastructure & audit logs.',
      storage: 'Unlimited Storage',
      features: [
        'Everything in Pro',
        'Enterprise Single Sign-On (SSO)',
        'Full Activity & Download Audit Trails',
        'Dedicated Cloud Region & Retention',
        'Dedicated Account Manager',
      ],
      cta: 'Contact Sales',
      popular: false,
      href: 'mailto:sales@vaultx.com',
    },
  ];

  const faqs = [
    {
      q: 'How does the Private Vault security unlock work?',
      a: 'The Private Vault is an encrypted partition protected by your own 6-digit PIN and optional backup password. Unlocking creates an ephemeral, time-limited cryptographic session that automatically re-locks after inactivity.',
    },
    {
      q: 'Can other users see my files without permission?',
      a: 'Never. All files uploaded to VaultX are completely private to your account by default. Only files you explicitly share with designated recipients or generate public access links for are accessible to others.',
    },
    {
      q: 'What happens when someone has View-Only permission?',
      a: 'Recipients with View-Only permissions can securely stream and preview images, documents, audio, or video files in their browser, but are strictly blocked from downloading the original source file.',
    },
    {
      q: 'What storage limit do I get on the Free plan?',
      a: 'Every new VaultX account receives 10 GB of high-speed cloud storage for free, with no expiration date or payment method required.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] selection:bg-blue-100 selection:text-[#2563EB]">
      {/* Reusable Navbar */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Trust Badges & Security Compliance */}
      <TrustBadgesSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Pricing Section */}
      <section id="pricing" className="py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider mb-2 block">
            Simple, Transparent Pricing
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight mb-4"
            style={{ fontFamily: 'Hanken Grotesk' }}
          >
            Choose the Perfect Plan
          </h2>
          <p className="text-[#64748B] text-sm sm:text-base">
            Get started for free with 10 GB storage, or upgrade for massive capacity and team tools.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-3xl p-8 transition-all flex flex-col justify-between ${
                tier.popular
                  ? 'bg-white border-2 border-[#2563EB] shadow-xl relative'
                  : 'bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#2563EB] text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-sm">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-[#0F172A]">{tier.name}</h3>
                  <span className="text-xs font-semibold text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-full">
                    {tier.storage}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mb-6">{tier.desc}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-[#0F172A]">{tier.price}</span>
                  <span className="text-xs text-[#64748B]">/{tier.period}</span>
                </div>

                <div className="space-y-3 pt-4 border-t border-[#F1F5F9] mb-8">
                  {tier.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-xs sm:text-sm text-[#0F172A]">
                      <span className="material-symbols-outlined text-base text-emerald-600">
                        check_circle
                      </span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link href={tier.href}>
                <button
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    tier.popular
                      ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md shadow-blue-500/20'
                      : 'bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0]'
                  }`}
                >
                  {tier.cta}
                </button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider mb-2 block">
              Frequently Asked Questions
            </span>
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight"
              style={{ fontFamily: 'Hanken Grotesk' }}
            >
              Everything You Need to Know
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 text-left"
              >
                <h3 className="text-base font-bold text-[#0F172A] mb-2">{faq.q}</h3>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <FinalCTASection />

      {/* Reusable Footer */}
      <Footer />
    </div>
  );
}
