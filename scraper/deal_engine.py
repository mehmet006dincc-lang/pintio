"""Deal eligibility engine — locked rules from spec."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone


@dataclass
class DealResult:
    eligible: bool
    discount_pct: int = 0
    is_6m_low: bool = False
    avg_180d: float | None = None
    min_180d: float | None = None
    reason: str = ''


def evaluate_deal(
    current_price: float,
    price_history: list[tuple[float, datetime]],
    seller_original: float | None = None,
) -> DealResult:
    if not price_history:
        return DealResult(eligible=False, reason='no_history')

    now = datetime.now(timezone.utc)
    days_180 = now - timedelta(days=180)
    days_30 = now - timedelta(days=30)
    days_14 = now - timedelta(days=14)

    history_180 = [(p, t) for p, t in price_history if t >= days_180]
    history_30 = [(p, t) for p, t in price_history if t >= days_30]

    if not history_180:
        return DealResult(eligible=False, reason='insufficient_history')

    first_record = min(t for _, t in price_history)
    if first_record > days_14:
        return DealResult(eligible=False, reason='less_than_14_days')

    prices_180 = [p for p, _ in history_180]
    prices_30 = [p for p, _ in history_30]

    min_180 = min(prices_180)
    avg_180 = sum(prices_180) / len(prices_180)
    avg_30 = sum(prices_30) / len(prices_30) if prices_30 else avg_180

    discount_pct = round((avg_180 - current_price) / avg_180 * 100) if avg_180 > 0 else 0

    is_6m_low = current_price <= min_180 * 1.01 and current_price <= min_180 + 5

    # Fake discount filter
    if seller_original and seller_original > 0:
        seller_discount = (seller_original - current_price) / seller_original
        if seller_discount >= 0.25 and current_price >= avg_180 * 0.97:
            return DealResult(eligible=False, reason='fake_discount')

    absolute_drop = avg_30 - current_price
    min_absolute = max(25, current_price * 0.03)

    eligible = (
        is_6m_low or discount_pct >= 15
    ) and (
        current_price <= avg_180 * 0.85
    ) and (
        current_price <= avg_30 * 0.90
    ) and (
        absolute_drop >= min_absolute
    )

    return DealResult(
        eligible=eligible,
        discount_pct=max(discount_pct, 0),
        is_6m_low=is_6m_low,
        avg_180d=round(avg_180, 2),
        min_180d=round(min_180, 2),
        reason='eligible' if eligible else 'threshold_not_met',
    )


def should_push(deal: DealResult, current_price: float, last_push_price: float | None) -> bool:
    """Strict push for repeat alerts (6m low + 18%+)."""
    if not deal.eligible or not deal.is_6m_low:
        return False
    if deal.discount_pct < 18:
        return False
    if last_push_price and current_price >= last_push_price * 0.95:
        return False
    return True


def should_notify(deal: DealResult, current_price: float, last_push_price: float | None) -> bool:
    """In-app + broadcast notification when a product qualifies as a real deal."""
    if not deal.eligible:
        return False
    if not (deal.is_6m_low or deal.discount_pct >= 15):
        return False
    if last_push_price and current_price >= last_push_price * 0.95:
        return False
    return True
