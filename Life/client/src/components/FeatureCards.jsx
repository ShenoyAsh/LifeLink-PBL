import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Zap, ShieldCheck, Award, Activity, TrendingUp } from 'lucide-react'; // Added new icons

const features = [
  {
    name: 'Location-Aware Matching',
    description: 'Our system instantly finds the nearest compatible donors using geospatial queries, minimizing critical wait times.',
    icon: MapPin,
  },
  {
    name: 'Real-Time Connectivity',
    description: 'Patients and verified donors are connected in real-time via email and SMS alerts, facilitating immediate communication.',
    icon: Zap,
  },
  {
    name: 'Verified Network',
    description: 'All donors are verified via OTP and admin checks, ensuring a safe and reliable network of willing participants.',
    icon: ShieldCheck,
  },
  {
    name: 'Donor Gamification',
    description: 'Earn points, unlock badges like "Life Saver," and climb the leaderboard. We make saving lives a rewarding experience.',
    icon: Award,
  },
  {
    name: 'Health & Eligibility',
    description: 'Track your donation history and vitals. Our intelligent system automatically calculates when you are safe to donate again.',
    icon: Activity,
  },
  {
    name: 'AI Shortage Predictions',
    description: 'Admins use our AI-driven analytics to predict blood shortages up to 30 days in advance and take proactive measures.',
    icon: TrendingUp,
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1, // Reduced delay slightly for smoother loading of more cards
      duration: 0.5,
    },
  }),
};

export default function FeatureCards() {
  return (
    <div className="py-24 sm:py-32">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Platform Features</h2>
          <p className="mt-4 text-lg leading-8 text-gray-600">Everything you need to manage blood donations effectively.</p>
        </div>
        
        {/* Updated to grid-cols-3 to fit 6 cards nicely (2 rows of 3) */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.name}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }} // Changed amount to trigger earlier
              variants={cardVariants}
              className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-900/5 transition duration-300 hover:shadow-xl hover:ring-primary-green/20 flex flex-col"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-light-green text-primary-green">
                <feature.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold leading-7 text-gray-900">{feature.name}</h3>
              <p className="mt-4 flex-auto text-base leading-7 text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}