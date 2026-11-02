// THE HISTORY PAGE: a chart of what you finished in 7 days, then your finished tasks,
// grouped by the day you finished them. Tasks finished before History existed have no
// "done on" date: they go under "Earlier" and aren't counted in the chart
import { useState } from "react";
import { LEVELS, levelProgress, plusDays, shortDay, todayString } from "./tasks.js";
import Dog from "./Dog.jsx";
import Icon from "./Icon.jsx";

// A heading for one day: "Today", "Yesterday" or "Fri 30 Oct"
function dayHeading(date) {
  if (date === todayString()) {
    return "Today";
  }
  if (date === plusDays(todayString(), -1)) {
    return "Yesterday";
  }
  return shortDay(date);
}

// done = every finished task (for the chart), shown = the ones that match the search (for the list).
// streak, level: worked out by App. rewardsOn: whether streaks and levels are shown at all
export default function History({ done, shown, drawTask, streak, level, rewardsOn, onRewards }) {
  // 0 = the last 7 days, 1 = the 7 days before those, and so on (the ‹ › buttons)
  const [weeksBack, setWeeksBack] = useState(0);

  // The chart's 7 days, oldest first, each with how many tasks were finished that day
  const bars = [];
  for (let i = 6; i >= 0; i--) {
    const date = plusDays(todayString(), -(weeksBack * 7 + i));
    bars.push({ date, count: done.filter((task) => task.doneDate === date).length });
  }
  const total = bars.reduce((sum, bar) => sum + bar.count, 0);
  const most = Math.max(1, ...bars.map((bar) => bar.count));   // the tallest bar (at least 1)
  const range = shortDay(bars[0].date).slice(4) + " – " + shortDay(bars[6].date).slice(4);   // "27 Oct – 2 Nov"

  // Finished in the last 7 days (whichever week the chart shows)
  const lastWeek = done.filter((task) => task.doneDate >= plusDays(todayString(), -6)).length;
  const next = LEVELS[level + 1];   // the next level (none at the top)

  // The days that have finished tasks, newest first ("YYYY-MM-DD" text sorts like dates)
  const dates = [];
  shown.forEach((task) => {
    if (task.doneDate !== "" && !dates.includes(task.doneDate)) {
      dates.push(task.doneDate);
    }
  });
  dates.sort().reverse();
  const undated = shown.filter((task) => task.doneDate === "");

  return (
    <>
      {/* STREAKS AND THE DOG'S LEVEL: facts, not praise. The switch hides them */}
      {rewardsOn && (
        <section className="facts" aria-label="Streaks and level">
          <p className="fact"><strong>{streak.current}</strong> {streak.current === 1 ? "day" : "days"} in a row</p>
          <p className="fact"><strong>{streak.best}</strong> best run</p>
          <p className="fact"><strong>{lastWeek}</strong> done in 7 days</p>
          <div className="fact level-fact">
            <span className="level-dog"><Dog level={level} /></span>
            <span className="level-text">
              <strong>{LEVELS[level].name}</strong>
              <span className="level-next">{next ? next.at - done.length + " more to " + next.name : done.length + " done in all"}</span>
              <span className="steps-track"><span className="steps-fill" style={{ transform: "scaleX(" + levelProgress(done.length) + ")" }}></span></span>
            </span>
          </div>
        </section>
      )}
      <label className="rewards-switch">
        <input type="checkbox" checked={rewardsOn} onChange={(event) => onRewards(event.target.checked)} />
        Show streaks and levels
      </label>

      <section className="history-chart" aria-label="Tasks done per day">
        <div className="chart-head">
          <button className="icon-button" aria-label="The 7 days before" title="The 7 days before" onClick={() => setWeeksBack(weeksBack + 1)}>
            <Icon name="chevron-left" />
          </button>
          <p className="chart-title">
            <strong>{total}</strong> done · {weeksBack === 0 ? "last 7 days" : range}
          </p>
          <button className="icon-button" aria-label="The 7 days after" title="The 7 days after" disabled={weeksBack === 0} onClick={() => setWeeksBack(weeksBack - 1)}>
            <Icon name="chevron-right" />
          </button>
        </div>
        {/* One bar per day. Its height is its share of the tallest bar.
            Hover (or Tab to) a bar to see its number */}
        <ol className="bars">
          {bars.map((day) => (
            <li key={day.date} className={day.date === todayString() ? "bar-day today" : "bar-day"} tabIndex={0} aria-label={shortDay(day.date) + ": " + day.count + " done"}>
              <span className="bar-tip">{day.count}</span>
              <span className="bar-area">
                {day.count > 0 && <span className="bar" style={{ height: (day.count / most) * 100 + "%" }}></span>}
              </span>
              <span className="bar-label">{shortDay(day.date).slice(0, 3)}</span>
            </li>
          ))}
        </ol>
      </section>

      {shown.length === 0 && <p className="no-results">{done.length === 0 ? "Finished tasks show up here, by the day you finished them" : "No finished tasks match"}</p>}

      {dates.map((date) => (
        <section className="task-section" key={date}>
          <h2 className="section-title">{dayHeading(date)} <span className="section-count">{shown.filter((task) => task.doneDate === date).length}</span></h2>
          <ul className="task-list history-list">{shown.filter((task) => task.doneDate === date).map(drawTask)}</ul>
        </section>
      ))}

      {undated.length > 0 && (
        <section className="task-section">
          <h2 className="section-title">Earlier <span className="section-count">{undated.length}</span></h2>
          <ul className="task-list history-list">{undated.map(drawTask)}</ul>
        </section>
      )}
    </>
  );
}
