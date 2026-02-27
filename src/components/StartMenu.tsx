import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { GameMode } from '../store/gameStore';

interface StartMenuProps {
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  onStartGame: () => void;
}

export default function StartMenu({ mode, onModeChange, onStartGame }: StartMenuProps) {
  const [ruleOpen, setRuleOpen] = useState(false);
  const [bgmOn, setBgmOn] = useState(false);

  const modeLabel = useMemo(() => (mode === 'ai' ? '挑战AI' : '1v1 对战'), [mode]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_10%,#5b4a1a_0%,#1f2937_45%,#020617_100%)] p-4 text-zinc-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl rounded-3xl border border-amber-300/30 bg-black/45 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur md:p-8"
      >
        <div className="text-center">
          <p className="text-xs tracking-[0.5em] text-amber-200/85">WU XING</p>
          <h1 className="mt-2 bg-gradient-to-b from-amber-200 to-amber-500 bg-clip-text text-5xl font-black tracking-[0.15em] text-transparent md:text-7xl">
            五行湮灭
          </h1>
          <p className="mt-3 text-sm text-zinc-300">模式：{modeLabel}</p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => onModeChange('hotseat')}
            className={`rounded-xl px-4 py-3 text-sm font-semibold ${
              mode === 'hotseat' ? 'bg-cyan-500 text-slate-950' : 'bg-zinc-800 text-zinc-100'
            }`}
          >
            1v1 对战
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => onModeChange('ai')}
            className={`rounded-xl px-4 py-3 text-sm font-semibold ${
              mode === 'ai' ? 'bg-violet-500 text-white' : 'bg-zinc-800 text-zinc-100'
            }`}
          >
            挑战AI
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => setRuleOpen(true)}
            className="rounded-xl bg-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-100"
          >
            规则说明
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onStartGame}
            className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-slate-900"
          >
            开始游戏
          </motion.button>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setBgmOn((v) => !v)}
            className="rounded-full border border-zinc-500/60 px-4 py-2 text-xs text-zinc-200"
          >
            BGM：{bgmOn ? '开启（预留）' : '静音'}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {ruleOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setRuleOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl rounded-2xl bg-zinc-950 p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-amber-300">五行湮灭 - 规则</h3>
              <div className="mt-3 space-y-2 text-sm text-zinc-200">
                <p>1. 目标：将自己的手牌数量先降为 0。</p>
                <p>2. 牌组成：普通元素牌（金木水火土）、精通牌（金木水火土精通）、阴阳鱼。</p>
                <p>3. 出牌方式：单张普通牌 / 1张精通+同元素普通牌 / 单张阴阳鱼。</p>
                <p>4. 过程堆与有效顶元素：空堆或堆顶阴阳鱼为无；否则取堆顶元素。</p>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full border-collapse text-xs text-zinc-200">
                  <thead>
                    <tr className="bg-zinc-800/70">
                      <th className="border border-zinc-700 px-2 py-1 text-left">出牌关系</th>
                      <th className="border border-zinc-700 px-2 py-1 text-left">判定依据（played vs top）</th>
                      <th className="border border-zinc-700 px-2 py-1 text-left">结果</th>
                      <th className="border border-zinc-700 px-2 py-1 text-left">回合流转</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-zinc-700 px-2 py-1">阴阳鱼</td>
                      <td className="border border-zinc-700 px-2 py-1">单张阴阳鱼</td>
                      <td className="border border-zinc-700 px-2 py-1">叠加到过程堆</td>
                      <td className="border border-zinc-700 px-2 py-1">当前结束，下一位出牌</td>
                    </tr>
                    <tr>
                      <td className="border border-zinc-700 px-2 py-1">相同</td>
                      <td className="border border-zinc-700 px-2 py-1">played == top</td>
                      <td className="border border-zinc-700 px-2 py-1">叠加到过程堆</td>
                      <td className="border border-zinc-700 px-2 py-1">当前结束，下一位出牌</td>
                    </tr>
                    <tr>
                      <td className="border border-zinc-700 px-2 py-1">相生</td>
                      <td className="border border-zinc-700 px-2 py-1">shengMap[top] == played</td>
                      <td className="border border-zinc-700 px-2 py-1">叠加到过程堆</td>
                      <td className="border border-zinc-700 px-2 py-1">当前结束，下一位出牌</td>
                    </tr>
                    <tr>
                      <td className="border border-zinc-700 px-2 py-1">相克</td>
                      <td className="border border-zinc-700 px-2 py-1">keMap[played] == top</td>
                      <td className="border border-zinc-700 px-2 py-1">本次打出非阴阳鱼入湮灭；顶连续同元素组退回上家；上家补惩罚牌</td>
                      <td className="border border-zinc-700 px-2 py-1">上家拿牌并立即出牌</td>
                    </tr>
                    <tr>
                      <td className="border border-zinc-700 px-2 py-1">被克制</td>
                      <td className="border border-zinc-700 px-2 py-1">keMap[top] == played</td>
                      <td className="border border-zinc-700 px-2 py-1">顶连续同元素组入湮灭；本次打出非阴阳鱼退回；当前补惩罚牌</td>
                      <td className="border border-zinc-700 px-2 py-1">当前拿牌并继续出牌</td>
                    </tr>
                    <tr>
                      <td className="border border-zinc-700 px-2 py-1">非法</td>
                      <td className="border border-zinc-700 px-2 py-1">不满足以上关系</td>
                      <td className="border border-zinc-700 px-2 py-1">本次出牌无效</td>
                      <td className="border border-zinc-700 px-2 py-1">当前继续操作</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-3 space-y-1 text-xs text-zinc-300">
                <p>5. 拿过程堆：当前可拿走整个过程堆，过程堆清空，当前继续出牌。</p>
                <p>6. 相生：金→水，水→木，木→火，火→土，土→金。</p>
                <p>7. 相克：金→木，木→土，土→水，水→火，火→金。</p>
                <p>8. 胜利条件：任意玩家手牌首次为 0，立即获胜。</p>
              </div>
              <div className="mt-4 text-right">
                <button type="button" className="rounded bg-cyan-700 px-3 py-1 text-sm" onClick={() => setRuleOpen(false)}>
                  关闭
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
