"use strict";
class Tweet {
    text;
    time;
    constructor(tweet_text, tweet_time) {
        this.text = tweet_text;
        this.time = new Date(tweet_time);
    }
    //returns either 'live_event', 'achievement', 'completed_event', or 'miscellaneous'
    get source() {
        const t = this.text;
        const tl = t.toLowerCase();
        // Completed events
        if (/^just (completed|posted)\b/i.test(t) || /^completed my\b/i.test(t)) {
            return 'completed_event';
        }
        // Live events
        if (/\b#rklive\b/i.test(tl) ||
            /\bright now\b/.test(tl) ||
            /\bwatch my (run|ride|walk)\b/.test(tl) ||
            /\blive (tracking|track)\b/.test(tl)) {
            return 'live_event';
        }
        // Achievements
        if (/\bachiev(e|ed|ement)\b/.test(tl) ||
            /\bpersonal (record|best)\b/.test(tl) ||
            /\bnew\s*pr\b/.test(tl) ||
            /\bgoal\b/.test(tl) ||
            /\b#fitnessalerts\b/.test(tl) ||
            /\b(record|badge)\b/.test(tl)) {
            return 'achievement';
        }
        return 'miscellaneous';
    }
    // -------------------------------------------------------------
    // Determines whether a tweet includes user-written text
    // -------------------------------------------------------------
    _computeWrittenRemainder() {
        const raw = this.text;
        // Obvious system templates (no custom text)
        const systemOnly = /^just\s+(completed|posted)\s+a\b[\s\S]*?(with\s+@?runkeeper\.)?\s*check it out!?[\s\S]*https?:\/\/\S+\s*(#runkeeper\b)?\s*$/i;
        const liveOnly = /^(watch my (run|ride|walk|workout)\s+right now\b|.*\b#rklive\b)[\s\S]*https?:\/\/\S+\s*(#runkeeper\b)?\s*$/i;
        const prOnly = /^achiev(?:e|ed|ement).*#fitnessalerts[\s\S]*https?:\/\/\S+\s*$/i;
        if (systemOnly.test(raw) || liveOnly.test(raw) || prOnly.test(raw))
            return "";
        // Remove URL, hashtags, handles
        let s = raw
            .replace(/https?:\/\/\S+/gi, " ")
            .replace(/#\w+/g, " ")
            .replace(/@\w+/g, " ");
        // Remove standard boilerplate phrases
        const boiler = [
            "Just completed a", "Just completed", "Just posted a", "Just posted",
            "with @Runkeeper", "with Runkeeper", "using Runkeeper", "from Runkeeper",
            "Check it out", "Watch my run right now", "Live", "Live tracking",
            "Achieved a new personal record", "personal record", "Distance goal",
            "Time goal", "MySports", "TomTom MySports Watch"
        ];
        for (const phrase of boiler) {
            s = s.replace(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), " ");
        }
        // Extract portion before URL
        const beforeUrl = raw.split(/https?:\/\/\S+/i)[0];
        // Look for a " - " dash segment (most written tweets use this)
        let dashRight = "";
        const dashIdx = beforeUrl.indexOf(" - ");
        if (dashIdx !== -1) {
            dashRight = beforeUrl.slice(dashIdx + 3).trim();
        }
        // Ignore boilerplate dash text (e.g. "TomTom MySports Watch")
        const dashBoiler = /^(tomtom mysports watch|mysports freestyle|workout \d+|treadmill walking)$/i;
        if (dashRight && !dashBoiler.test(dashRight) && /[A-Za-z]/.test(dashRight)) {
            return dashRight;
        }
        // Remove activity metadata and metrics
        s = s
            .replace(/\b\d+(?:\.\d+)?\s*(?:km|kilometers?|mi|miles?)\b/gi, " ")
            .replace(/\b\d+:\d{2}:\d{2}\b/g, " ")
            .replace(/\b\d+:\d{2}\b/g, " ")
            .replace(/\b(run|running|walk|walking|ride|bike|biking|cycling|swim|swimming|row|rowing|elliptical|hike|hiking|spinning|mtn\s*bike|activity|workout)\b/gi, " ")
            .replace(/\s[-–—:]\s*/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        if (!/[A-Za-z]/.test(s) || s.length < 3)
            return "";
        return s;
    }
    get written() {
        return this._computeWrittenRemainder().length > 0;
    }
    get writtenText() {
        return this._computeWrittenRemainder();
    }
    get activityType() {
        if (this.source != 'completed_event')
            return "unknown";
        const t = this.text.toLowerCase();
        const map = {
            run: 'running', running: 'running',
            walk: 'walking', walking: 'walking',
            bike: 'cycling', biking: 'cycling', ride: 'cycling', cycling: 'cycling',
            swim: 'swimming', swimming: 'swimming',
            row: 'rowing', rowing: 'rowing',
            hike: 'hiking', hiking: 'hiking',
            elliptical: 'elliptical',
            yoga: 'yoga'
        };
        const priority = ['running', 'cycling', 'walking', 'swimming', 'rowing', 'hiking', 'elliptical', 'yoga'];
        const found = new Set();
        for (const key in map) {
            if (new RegExp(`\\b${key}\\b`).test(t))
                found.add(map[key]);
        }
        for (const p of priority)
            if (found.has(p))
                return p;
        return "unknown";
    }
    get distance() {
        if (this.source != 'completed_event')
            return 0;
        const m = this.text.match(/(\d+(?:\.\d+)?)\s*(mi|mile|miles|km|kilometer|kilometers)\b/i);
        if (!m)
            return 0;
        const val = parseFloat(m[1]);
        const unit = m[2].toLowerCase();
        if (['mi', 'mile', 'miles'].includes(unit))
            return val;
        return val / 1.609; // km → mi
    }
    getHTMLTableRow(rowNumber) {
        const urlMatch = this.text.match(/https?:\/\/\S+/i);
        const url = urlMatch ? urlMatch[0] : '';
        const linked = this.text.replace(/https?:\/\/\S+/g, u => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);
        const safeType = this.source === 'completed_event' && this.activityType !== 'unknown'
            ? this.activityType
            : '(n/a)';
        return `<tr>
			<td>${rowNumber}</td>
			<td>${safeType}</td>
			<td>${linked}</td>
		</tr>`;
    }
}
// Expose the class globally
window.Tweet = Tweet;
