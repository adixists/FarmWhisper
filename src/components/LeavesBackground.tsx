import { motion } from 'motion/react';
import { Leaf } from 'lucide-react';
import { useEffect, useState } from 'react';

// Leaves with inline style colors to avoid Tailwind JIT purging dynamic class strings
const LEAVES = [
  { id: 1,  top: '8%',  left: '5%',  scale: 1.2, duration: 22, delay: 0,   color: '#10b981', opacity: 0.22 },
  { id: 2,  top: '20%', left: '88%', scale: 0.7, duration: 28, delay: 1.5, color: '#4ade80', opacity: 0.18 },
  { id: 3,  top: '45%', left: '10%', scale: 1.5, duration: 20, delay: 3,   color: '#059669', opacity: 0.16 },
  { id: 4,  top: '65%', left: '78%', scale: 1.0, duration: 26, delay: 0.5, color: '#86efac', opacity: 0.28 },
  { id: 5,  top: '80%', left: '18%', scale: 0.8, duration: 24, delay: 2,   color: '#10b981', opacity: 0.18 },
  { id: 6,  top: '35%', left: '92%', scale: 1.3, duration: 30, delay: 4,   color: '#4ade80', opacity: 0.22 },
  { id: 7,  top: '55%', left: '50%', scale: 0.6, duration: 18, delay: 6,   color: '#6ee7b7', opacity: 0.14 },
  { id: 8,  top: '12%', left: '60%', scale: 1.1, duration: 32, delay: 2.5, color: '#22c55e', opacity: 0.18 },
  { id: 9,  top: '90%', left: '55%', scale: 0.9, duration: 27, delay: 1,   color: '#10b981', opacity: 0.20 },
  { id: 10, top: '72%', left: '3%',  scale: 1.4, duration: 23, delay: 5,   color: '#86efac', opacity: 0.22 },
];

// Gentle wind-sway keyframes — alternating direction for organic feel
const getSwayKeyframes = (idx: number) => {
  const isOdd = idx % 2 === 1;
  return {
    y:      isOdd ? [0, -18, 12, -6,  0] : [0, 14, -20, 8,   0],
    x:      isOdd ? [0, 30,  -15, 25, 0] : [0, -20, 35, -10, 0],
    rotate: isOdd ? [0, 25,  -10, 18, 0] : [0, -20, 15, -8,  0],
  };
};

export function LeavesBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Soft gradient background — fresh morning field */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#EEF7F1] via-[#F3FAF5] to-[#E8F5EE]" />

      {/* Radial light flares */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl" style={{ background: 'rgba(167,243,208,0.45)' }} />
      <div className="absolute top-1/3 -right-16 w-56 h-56 rounded-full blur-3xl" style={{ background: 'rgba(187,247,208,0.38)' }} />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full blur-3xl" style={{ background: 'rgba(217,249,157,0.28)' }} />

      {/* Animated foreground leaves with wind-sway (inline color to avoid JIT purge) */}
      {LEAVES.map((leaf, idx) => (
        <motion.div
          key={leaf.id}
          className="absolute"
          style={{ top: leaf.top, left: leaf.left, color: leaf.color, opacity: leaf.opacity }}
          animate={getSwayKeyframes(idx)}
          transition={{
            duration: leaf.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: leaf.delay,
            times: [0, 0.25, 0.5, 0.75, 1],
          }}
        >
          <Leaf size={38 * leaf.scale} strokeWidth={1.5} fill="currentColor" />
        </motion.div>
      ))}

      {/* Two large blurred bg leaves for parallax depth */}
      <motion.div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 blur-3xl"
        style={{ color: '#6ee7b7', opacity: 0.13 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 110, repeat: Infinity, ease: 'linear' }}
      >
        <Leaf size={260} fill="currentColor" />
      </motion.div>

      <motion.div
        className="absolute bottom-1/4 right-1/4 blur-3xl"
        style={{ color: '#86efac', opacity: 0.13 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 130, repeat: Infinity, ease: 'linear' }}
      >
        <Leaf size={210} fill="currentColor" />
      </motion.div>
    </div>
  );
}

