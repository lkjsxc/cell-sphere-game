# Balancing

Balance is measured with production `RunController` cohorts, fixed seed sets,
and explicit external budgets. An exhausted audit budget is incomplete and
reward-free; it is never converted into an extinction.

## Current direction

- Fresh Worlds should be resource-limited rather than event-limited.
- The provisional fresh no-Evolution target is a 45–90 game-second median.
- A first general Evolution root should normally outlive fresh Worlds on paired
  seeds.
- Resource exhaustion should dominate early extinction causes (provisionally at
  least 65% where causal evidence supports it).
- No finite Evolution build is immortal.

The chronic-pressure migration intentionally removed the old 270–330-second
contract, event survival metrics, and fixed campaign-time targets. The current
implementation still needs the dedicated resource-limited cohort retune; do not
interpret pre-retune duration reports as evidence that the new target is met.

## Commands

```bash
npm run balance:smoke
npm run balance:holdout
npm run audit:environment-levels
npm run audit:campaign
```

Reports include distributions, causes, SCORE/Echoes, and Environment peaks.
