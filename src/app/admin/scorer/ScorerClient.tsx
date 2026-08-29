"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  Undo2,
  Redo2,
  RotateCcw,
  Pause,
  SkipForward,
  Square,
  ChevronRight,
} from "lucide-react";
import {
  recordBall,
  undoLastBall,
  redoLastBall,
  setToss,
  endInnings,
  endMatch,
  delayMatch,
  restartMatch,
} from "./actions";

type MatchData = {
  id: string;
  team1Id: string;
  team2Id: string;
  team1Name: string;
  team1Initials: string;
  team1Logo: string | null;
  team2Name: string;
  team2Initials: string;
  team2Logo: string | null;
  status: string;
  tossWinnerId: string | null;
  tossDecision: string | null;
  battingFirstId: string | null;
  currentInnings: number | null;
  totalOvers: number;
  matchType: string;
  stage: string | null;
};

type Score = {
  totalRuns: number;
  wickets: number;
  oversStr: string;
  crr: string;
  legalBalls: number;
};

export default function ScorerClient({
  matches,
  liveMatch,
  score,
  firstInningsScore,
  totalOvers,
}: {
  matches: MatchData[];
  liveMatch: MatchData | null;
  score: Score;
  firstInningsScore: number | null;
  totalOvers: number;
}) {
  const [extraModal, setExtraModal] = useState<"WIDE" | "NO_BALL" | "RUN_OUT" | null>(null);

  // ─── NO ACTIVE MATCH: Show match selector ───
  if (!liveMatch || liveMatch.status === "SCHEDULED") {
    return (
      <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-5 w-5 text-red-500" />
            Live Scorer
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Select a match to start scoring</p>
        </div>
        <Separator />
        {matches.filter((m) => m.status === "SCHEDULED").length > 0 ? (
          <div className="space-y-2">
            {matches
              .filter((m) => m.status === "SCHEDULED")
              .map((m) => (
                <Card key={m.id} className="hover:bg-muted/30 transition-colors cursor-pointer">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">
                          {m.team1Name} vs {m.team2Name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {m.totalOvers} overs {m.stage ? `• ${m.stage}` : ""}
                        </div>
                      </div>
                      <form action={setToss}>
                        <input type="hidden" name="matchId" value={m.id} />
                        <input type="hidden" name="team1Id" value={m.team1Id} />
                        <input type="hidden" name="team2Id" value={m.team2Id} />
                        <input type="hidden" name="tossWinnerId" value={m.team1Id} />
                        <input type="hidden" name="tossDecision" value="BAT" />
                        <Button size="sm" variant="outline" className="gap-1.5">
                          Start <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              No scheduled matches. Create a match first.
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ─── TOSS SCREEN ───
  if (liveMatch.status === "TOSS" && !liveMatch.battingFirstId) {
    return <TossScreen match={liveMatch} />;
  }

  // ─── MAIN SCORING UI ───
  const currentInnings = liveMatch.currentInnings || 1;
  const battingFirstId = liveMatch.battingFirstId || liveMatch.team1Id;
  const battingTeamId = currentInnings === 1 ? battingFirstId : (battingFirstId === liveMatch.team1Id ? liveMatch.team2Id : liveMatch.team1Id);
  const bowlingTeamId = battingTeamId === liveMatch.team1Id ? liveMatch.team2Id : liveMatch.team1Id;
  const battingTeamName = battingTeamId === liveMatch.team1Id ? liveMatch.team1Name : liveMatch.team2Name;
  const bowlingTeamName = bowlingTeamId === liveMatch.team1Id ? liveMatch.team1Name : liveMatch.team2Name;
  const battingInitials = battingTeamId === liveMatch.team1Id ? liveMatch.team1Initials : liveMatch.team2Initials;

  const target = firstInningsScore !== null ? firstInningsScore + 1 : null;
  const runsNeeded = target !== null ? target - score.totalRuns : null;
  const ballsLeft = target !== null ? totalOvers * 6 - score.legalBalls : null;

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            Live Scorer
          </h1>
          <p className="text-xs text-muted-foreground">Innings {currentInnings}</p>
        </div>
        <Badge variant="destructive" className="animate-pulse-live text-[10px]">
          LIVE
        </Badge>
      </div>

      {/* Scoreboard */}
      <Card className="border-red-500/20">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {battingTeamName}
              </div>
              <div className="text-4xl font-black tabular-nums tracking-tight mt-0.5">
                {score.totalRuns}
                <span className="text-2xl text-muted-foreground">/{score.wickets}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Overs</div>
              <div className="text-2xl font-bold tabular-nums">{score.oversStr}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">
              CRR: <span className="text-foreground font-medium">{score.crr}</span>
            </span>
            {target && (
              <>
                <span className="text-emerald-400">Target: {target}</span>
                <span className="text-yellow-400">
                  Need {runsNeeded} in {ballsLeft} balls
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Extra Modal */}
      {extraModal && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-3">
            <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              {extraModal === "WIDE" && "Wide Ball — Select extra runs:"}
              {extraModal === "NO_BALL" && "No Ball — Select runs scored:"}
              {extraModal === "RUN_OUT" && "Run Out — Runs completed:"}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((r) => (
                <form key={r} action={recordBall}>
                  <input type="hidden" name="matchId" value={liveMatch.id} />
                  <input type="hidden" name="innings" value={currentInnings} />
                  <input type="hidden" name="runs" value={extraModal === "WIDE" ? 0 : r} />
                  <input
                    type="hidden"
                    name="extras"
                    value={extraModal === "WIDE" ? 1 + r : extraModal === "NO_BALL" ? 1 : 0}
                  />
                  <input
                    type="hidden"
                    name="extraType"
                    value={extraModal === "RUN_OUT" ? "" : extraModal}
                  />
                  <input
                    type="hidden"
                    name="isWicket"
                    value={extraModal === "RUN_OUT" ? "true" : "false"}
                  />
                  <input
                    type="hidden"
                    name="wicketType"
                    value={extraModal === "RUN_OUT" ? "RUN_OUT" : ""}
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="w-full font-bold"
                    onClick={() => setExtraModal(null)}
                  >
                    {r}
                  </Button>
                </form>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={() => setExtraModal(null)}
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Run Buttons */}
      <Card>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">
            Runs
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-7 gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((r) => (
              <form key={r} action={recordBall}>
                <input type="hidden" name="matchId" value={liveMatch.id} />
                <input type="hidden" name="innings" value={currentInnings} />
                <input type="hidden" name="runs" value={r} />
                <input type="hidden" name="extras" value={0} />
                <input type="hidden" name="extraType" value="" />
                <input type="hidden" name="isWicket" value="false" />
                <input type="hidden" name="wicketType" value="" />
                <Button
                  type="submit"
                  variant={r === 4 || r === 6 ? "default" : "outline"}
                  className={`w-full font-bold text-lg h-12 ${
                    r === 4
                      ? "bg-blue-600 hover:bg-blue-500 text-white"
                      : r === 6
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : ""
                  }`}
                >
                  {r}
                </Button>
              </form>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Extras & Wickets */}
      <Card>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">
            Extras & Wickets
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-5 gap-2">
            <Button
              variant="outline"
              className="text-xs font-semibold h-10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              onClick={() => setExtraModal("WIDE")}
            >
              Wide
            </Button>
            <Button
              variant="outline"
              className="text-xs font-semibold h-10 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
              onClick={() => setExtraModal("NO_BALL")}
            >
              No Ball
            </Button>

            {/* Bowled */}
            <form action={recordBall}>
              <input type="hidden" name="matchId" value={liveMatch.id} />
              <input type="hidden" name="innings" value={currentInnings} />
              <input type="hidden" name="runs" value={0} />
              <input type="hidden" name="extras" value={0} />
              <input type="hidden" name="extraType" value="" />
              <input type="hidden" name="isWicket" value="true" />
              <input type="hidden" name="wicketType" value="BOWLED" />
              <Button
                type="submit"
                variant="outline"
                className="w-full text-xs font-semibold h-10 border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                Bowled
              </Button>
            </form>

            {/* Caught */}
            <form action={recordBall}>
              <input type="hidden" name="matchId" value={liveMatch.id} />
              <input type="hidden" name="innings" value={currentInnings} />
              <input type="hidden" name="runs" value={0} />
              <input type="hidden" name="extras" value={0} />
              <input type="hidden" name="extraType" value="" />
              <input type="hidden" name="isWicket" value="true" />
              <input type="hidden" name="wicketType" value="CAUGHT" />
              <Button
                type="submit"
                variant="outline"
                className="w-full text-xs font-semibold h-10 border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                Caught
              </Button>
            </form>

            {/* Run Out */}
            <Button
              variant="outline"
              className="text-xs font-semibold h-10 border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={() => setExtraModal("RUN_OUT")}
            >
              Run Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">
            Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {/* Undo */}
            <form action={undoLastBall}>
              <input type="hidden" name="matchId" value={liveMatch.id} />
              <input type="hidden" name="innings" value={currentInnings} />
              <Button type="submit" variant="outline" size="sm" className="w-full gap-1 text-xs">
                <Undo2 className="h-3.5 w-3.5" /> Undo
              </Button>
            </form>
            {/* Redo */}
            <form action={redoLastBall}>
              <input type="hidden" name="matchId" value={liveMatch.id} />
              <input type="hidden" name="innings" value={currentInnings} />
              <Button type="submit" variant="outline" size="sm" className="w-full gap-1 text-xs">
                <Redo2 className="h-3.5 w-3.5" /> Redo
              </Button>
            </form>
            {/* Restart */}
            <form action={restartMatch}>
              <input type="hidden" name="matchId" value={liveMatch.id} />
              <Button type="submit" variant="outline" size="sm" className="w-full gap-1 text-xs text-orange-400">
                <RotateCcw className="h-3.5 w-3.5" /> Restart
              </Button>
            </form>
            {/* Delay */}
            <form action={delayMatch}>
              <input type="hidden" name="matchId" value={liveMatch.id} />
              <Button type="submit" variant="outline" size="sm" className="w-full gap-1 text-xs text-yellow-400">
                <Pause className="h-3.5 w-3.5" /> Delay
              </Button>
            </form>
            {/* End Innings */}
            {currentInnings === 1 && (
              <form action={endInnings}>
                <input type="hidden" name="matchId" value={liveMatch.id} />
                <Button type="submit" variant="outline" size="sm" className="w-full gap-1 text-xs text-blue-400">
                  <SkipForward className="h-3.5 w-3.5" /> End Inn.
                </Button>
              </form>
            )}
            {/* End Match */}
            <form action={endMatch}>
              <input type="hidden" name="matchId" value={liveMatch.id} />
              <Button type="submit" variant="destructive" size="sm" className="w-full gap-1 text-xs">
                <Square className="h-3.5 w-3.5" /> End Match
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── TOSS SCREEN ───────────────────────────────
function TossScreen({ match }: { match: MatchData }) {
  const [tossWinner, setTossWinner] = useState<string | null>(null);

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold">Toss</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {match.team1Name} vs {match.team2Name}
        </p>
      </div>

      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Who won the toss?
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={tossWinner === match.team1Id ? "default" : "outline"}
              className="h-14 text-sm font-semibold"
              onClick={() => setTossWinner(match.team1Id)}
            >
              {match.team1Initials}
            </Button>
            <Button
              variant={tossWinner === match.team2Id ? "default" : "outline"}
              className="h-14 text-sm font-semibold"
              onClick={() => setTossWinner(match.team2Id)}
            >
              {match.team2Initials}
            </Button>
          </div>

          {tossWinner && (
            <>
              <Separator />
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Chose to?
              </div>
              <div className="grid grid-cols-2 gap-3">
                <form action={setToss}>
                  <input type="hidden" name="matchId" value={match.id} />
                  <input type="hidden" name="team1Id" value={match.team1Id} />
                  <input type="hidden" name="team2Id" value={match.team2Id} />
                  <input type="hidden" name="tossWinnerId" value={tossWinner} />
                  <input type="hidden" name="tossDecision" value="BAT" />
                  <Button type="submit" variant="outline" className="w-full h-12 text-sm font-semibold">
                    🏏 Bat
                  </Button>
                </form>
                <form action={setToss}>
                  <input type="hidden" name="matchId" value={match.id} />
                  <input type="hidden" name="team1Id" value={match.team1Id} />
                  <input type="hidden" name="team2Id" value={match.team2Id} />
                  <input type="hidden" name="tossWinnerId" value={tossWinner} />
                  <input type="hidden" name="tossDecision" value="BOWL" />
                  <Button type="submit" variant="outline" className="w-full h-12 text-sm font-semibold">
                    ⚾ Bowl
                  </Button>
                </form>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
