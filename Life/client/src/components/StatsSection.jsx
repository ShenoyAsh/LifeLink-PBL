import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Activity } from 'lucide-react';

const stats = [
  { id: 1, name: 'Registered Donors', value: '1,200+', icon: Users },
  { id: 2, name: 'Lives Impacted', value: '3,500+', icon: Heart },
  { id: 3, name: 'Active Matches', value: '45', icon: Activity },
];

export default function StatsSection() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Our Impact So Far
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Real-time data showcasing the power of the LifeLink community.
            </p>
          </div>
          <dl className="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-3 bg-gray-100">
            {stats.map((stat) => (
              <motion.div 
                key={stat.id} 
                className="flex flex-col bg-white/50 p-8 hover:bg-white transition-colors"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <dt className="text-sm font-semibold leading-6 text-gray-600 flex justify-center items-center gap-2">
                    <stat.icon className="h-5 w-5 text-primary-green" />
                    {stat.name}
                </dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">
                    {stat.value}
                </dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}