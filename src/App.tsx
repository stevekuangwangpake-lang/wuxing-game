import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import BackCard from './components/BackCard';
import Card from './components/Card';
import Hand from './components/Hand';
import ProcessPile from './components/ProcessPile';
import StartMenu from './components/StartMenu';
import { useGameStore } from './store/gameStore';

function App() {
  const [ruleOpen, setRuleOpen] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const {
    players,
    currentPlayerIndex,
    selectedCardIds,
    drawPile,
    processPile,
    annihilatePile,
    winnerPlayerId,
    errorMessage,
    lastAction,
    gameMode,
    gameStarted,
    aiPlayerId,
    isAIThinking,
    isAITurn,
    lastAIDescription,
    setSelectedCardIds,
    clearSelection,
    playSelected,
    playCards,
    takeEntireProcessPile,
    resetGame,
    setGameMode,
    startNewGame,
    backToMenu,
    getEffectiveTopElementLabel,
  } = useGameStore();

  if (!gameStarted) {
    return <StartMenu mode={gameMode} onModeChange={setGameMode} onStartGame={() => startNewGame(gameMode)} />;
  }

  const currentPlayer = players[currentPlayerIndex];
  const winnerName = players.find((p) => p.id === winnerPlayerId)?.name ?? null;

  const humanPlayer = gameMode === 'ai' ? players.find((p) => p.id !== aiPlayerId) ?? players[0] : currentPlayer;
  const sidePlayers = gameMode === 'ai' ? players.filter((p) => p.id !== humanPlayer.id) : players.filter((_, idx) => idx !== currentPlayerIndex);

  const disableHumanActions = Boolean(winnerPlayerId) || isAITurn;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_15%,#0f766e_0%,#082f49_35%,#111827_70%,#020617_100%)] text-zinc-50">
      <main className="mx-auto flex max-w-7xl flex-col gap-4 p-3 md:p-6">
        <header className="rounded-2xl border border-cyan-300/40 bg-black/25 p-4 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-wide md:text-3xl">五行湮灭</h1>
              <p className="text-sm text-cyan-100/90">
                {winnerName ? `胜利者：${winnerName}` : isAITurn ? 'AI思考中...' : `${currentPlayer.name} 的回合`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded bg-black/30 px-3 py-1">模式：{gameMode === 'ai' ? '挑战AI' : '1v1 对战'}</span>
              <span className="rounded bg-black/30 px-3 py-1">抽牌堆：{drawPile.length}</span>
              <span className="rounded bg-black/30 px-3 py-1">过程堆：{processPile.length}</span>
              <span className="rounded bg-black/30 px-3 py-1">湮灭堆：{annihilatePile.length}</span>
              <span className="rounded bg-black/30 px-3 py-1">有效顶元素：{getEffectiveTopElementLabel()}</span>
            </div>
          </div>

          {isAIThinking ? (
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-700/70">
              <motion.div
                className="h-full bg-cyan-400"
                initial={{ x: '-100%' }}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              />
            </div>
          ) : null}

          <p className="mt-2 text-xs text-zinc-200">{lastAction}</p>
          {lastAIDescription ? <p className="mt-1 text-xs text-violet-200">{lastAIDescription}</p> : null}
          {errorMessage ? <p className="mt-1 text-xs text-rose-300">错误：{errorMessage}</p> : null}
        </header>

        <div className="grid gap-4 lg:grid-cols-[220px_1fr_280px]">
          <section className="rounded-2xl border border-zinc-400/30 bg-black/20 p-3 backdrop-blur">
            <h2 className="mb-3 text-sm font-semibold text-zinc-100">玩家区域</h2>
            <div className="space-y-3">
              {sidePlayers.map((player) => {
                const isAIPlayer = gameMode === 'ai' && player.id === aiPlayerId;
                return (
                  <div key={player.id} className="rounded-xl border border-zinc-500/30 bg-black/25 p-2">
                    <p className="mb-2 text-sm">
                      {player.name}
                      {isAIPlayer ? '（AI）' : ''}（{player.hand.length} 张）
                    </p>

                    {isAIPlayer ? (
                      <>
                        <p className="mb-2 text-xs text-zinc-300">AI 手牌：{player.hand.length} 张</p>
                        <div className="flex -space-x-7">
                          {Array.from({ length: Math.min(player.hand.length, 8) }).map((_, i) => (
                            <BackCard key={`${player.id}-back-${i}`} compact />
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex gap-1 overflow-x-auto py-1">
                        {player.hand.map((card) => (
                          <Card key={card.id} card={card} compact />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {gameMode === 'hotseat' ? (
                <div className="rounded-xl border border-zinc-500/30 bg-black/25 p-2 text-xs text-zinc-300">Hotseat 模式：双方手牌明牌显示。</div>
              ) : null}
            </div>
          </section>

          <ProcessPile processPile={processPile} effectiveTopElementLabel={getEffectiveTopElementLabel()} dropZoneRef={dropZoneRef} />

          <section className="rounded-2xl border border-zinc-400/30 bg-black/20 p-3 backdrop-blur">
            <h2 className="mb-3 text-sm font-semibold text-zinc-100">操作</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
              <button
                type="button"
                disabled={disableHumanActions || selectedCardIds.length === 0}
                onClick={playSelected}
                className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-cyan-900/60"
              >
                确认出牌
              </button>
              <button
                type="button"
                disabled={disableHumanActions}
                onClick={takeEntireProcessPile}
                className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-amber-900/60"
              >
                拿过程堆
              </button>
              <button
                type="button"
                disabled={disableHumanActions || selectedCardIds.length === 0}
                onClick={clearSelection}
                className="rounded-lg bg-zinc-700 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-zinc-800"
              >
                清空选择
              </button>
              <button type="button" onClick={() => setRuleOpen(true)} className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold">
                查看规则
              </button>
              <button type="button" onClick={resetGame} className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold sm:col-span-2 lg:col-span-2">
                重新开始
              </button>
              <button type="button" onClick={backToMenu} className="rounded-lg bg-zinc-600 px-3 py-2 text-sm font-semibold sm:col-span-2 lg:col-span-2">
                返回开始界面
              </button>
            </div>

            <p className="mt-3 text-xs text-zinc-200">拖拽卡牌到中间过程堆可直接出牌；若已多选，拖其中任一张会按当前多选组合出牌。</p>
            <button
              type="button"
              className="mt-2 rounded bg-sky-700 px-3 py-1 text-xs disabled:bg-sky-900/60"
              onClick={() => playCards(selectedCardIds)}
              disabled={disableHumanActions || selectedCardIds.length === 0}
            >
              快速提交当前选择
            </button>
          </section>
        </div>

        <Hand
          cards={humanPlayer.hand}
          selectedCardIds={selectedCardIds}
          onSelectChange={setSelectedCardIds}
          onPlayCards={playCards}
          dropZoneRef={dropZoneRef}
          disabled={disableHumanActions || currentPlayer.id !== humanPlayer.id}
          hidden={false}
        />
      </main>

      <AnimatePresence>
        {ruleOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRuleOpen(false)}
          >
            <motion.div
              className="w-full max-w-4xl rounded-2xl bg-zinc-950 p-4 text-sm"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-amber-300">五行湮灭 - 规则</h3>
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
              <div className="mt-3 text-right">
                <button type="button" className="rounded bg-cyan-700 px-3 py-1" onClick={() => setRuleOpen(false)}>
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

export default App;
