import { motion } from 'framer-motion';

interface BackCardProps {
  compact?: boolean;
  className?: string;
}

export default function BackCard({ compact = false, className = '' }: BackCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.02 }}
      className={[
        'relative rounded-2xl border border-zinc-500/70',
        compact ? 'h-24 w-16' : 'h-40 w-28',
        className,
      ].join(' ')}
      style={{
        background:
          'radial-gradient(circle at 20% 20%, #52525b 0%, #18181b 45%, #09090b 100%), repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 6px, rgba(0,0,0,0.08) 6px 12px)',
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center text-2xl text-zinc-200">☯</div>
      <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] tracking-widest text-zinc-300">五行湮灭</div>
    </motion.div>
  );
}
