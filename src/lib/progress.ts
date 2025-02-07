import { createSignal, createRoot } from "solid-js";

export interface ReadingProgress {
    paperId: string;
    progress: number;  // 0-100
    timeSpent: number; // seconds
    lastRead: string;  // ISO date
}

export interface ReadingStreak {
    currentStreak: number;
    longestStreak: number;
    lastReadDate: string;
    totalPapersRead: number;
}

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt?: string;
}

const STORAGE_KEY = {
    PROGRESS: "arxivtok_reading_progress",
    STREAK: "arxivtok_streak",
    ACHIEVEMENTS: "arxivtok_achievements"
};

const ACHIEVEMENTS: Achievement[] = [
    {
        id: "first_paper",
        title: "First Steps",
        description: "Read your first paper",
        icon: "🎯"
    },
    {
        id: "week_streak",
        title: "Weekly Scholar",
        description: "Maintain a 7-day reading streak",
        icon: "🔥"
    },
    {
        id: "ten_papers",
        title: "Knowledge Hunter",
        description: "Read 10 different papers",
        icon: "📚"
    },
    {
        id: "cross_domain",
        title: "Renaissance Reader",
        description: "Read papers from 3 different sources",
        icon: "🎨"
    },
    {
        id: "speed_reader",
        title: "Speed Reader",
        description: "Read 3 papers in under 15 minutes",
        icon: "⚡"
    },
    {
        id: "night_owl",
        title: "Night Owl",
        description: "Read papers after midnight",
        icon: "🦉"
    },
    {
        id: "weekend_scholar",
        title: "Weekend Scholar",
        description: "Read papers on both Saturday and Sunday",
        icon: "📚"
    },
    {
        id: "perfect_week",
        title: "Perfect Week",
        description: "Read at least one paper every day this week",
        icon: "🏆"
    }
];

export const [readingProgress, setReadingProgress] = createRoot(() => {
    const [progress, setProgress] = createSignal<Record<string, ReadingProgress>>({});
    return [progress, setProgress];
});

export const [streak, setStreak] = createRoot(() => {
    const [currentStreak, setCurrentStreak] = createSignal<ReadingStreak>({
        currentStreak: 0,
        longestStreak: 0,
        lastReadDate: '',
        totalPapersRead: 0
    });
    return [currentStreak, setCurrentStreak];
});

export const [achievements, setAchievements] = createRoot(() => {
    const [unlocked, setUnlocked] = createSignal<Achievement[]>([]);
    return [unlocked, setUnlocked];
});

export function updateReadingProgress(paperId: string, progressValue: number) {
    const now = new Date().toISOString();
    const currentProgress = readingProgress()[paperId];
    
    const updatedProgress = {
        ...currentProgress,
        paperId,
        progress: progressValue,
        timeSpent: (currentProgress?.timeSpent || 0) + 1,
        lastRead: now
    };

    setReadingProgress(prev => ({ ...prev, [paperId]: updatedProgress }));
    
    // Update streak
    const today = new Date().toDateString();
    const lastRead = streak().lastReadDate ? new Date(streak().lastReadDate).toDateString() : '';
    
    if (today !== lastRead && progressValue >= 70) {
        const isConsecutiveDay = new Date(lastRead).getTime() === new Date().getTime() - 86400000;
        
        setStreak(prev => ({
            currentStreak: isConsecutiveDay ? prev.currentStreak + 1 : 1,
            longestStreak: Math.max(prev.longestStreak, isConsecutiveDay ? prev.currentStreak + 1 : 1),
            lastReadDate: now,
            totalPapersRead: prev.totalPapersRead + 1
        }));

        checkAchievements();
    }

    saveProgress();
}

function checkAchievements() {
    const currentAchievements = achievements();
    const newAchievements: Achievement[] = [];
    const stats = streak();

    // Check for achievements
    if (stats.totalPapersRead === 1) {
        newAchievements.push({ ...ACHIEVEMENTS[0], unlockedAt: new Date().toISOString() });
    }
    if (stats.currentStreak >= 7) {
        newAchievements.push({ ...ACHIEVEMENTS[1], unlockedAt: new Date().toISOString() });
    }
    if (stats.totalPapersRead >= 10) {
        newAchievements.push({ ...ACHIEVEMENTS[2], unlockedAt: new Date().toISOString() });
    }

    // Only add new achievements
    const toAdd = newAchievements.filter(
        achievement => !currentAchievements.some(a => a.id === achievement.id)
    );

    if (toAdd.length > 0) {
        setAchievements(prev => [...prev, ...toAdd]);
        saveProgress();
        // Trigger achievement animation/notification here
    }

    checkSpecialAchievements();
}

// Añadir función para comprobar logros especiales
function checkSpecialAchievements() {
    const now = new Date();
    const stats = readingProgress();
    const todayReadings = Object.values(stats).filter(
        p => new Date(p.lastRead).toDateString() === now.toDateString()
    );

    // Check speed reader
    if (todayReadings.length >= 3) {
        const timeSpent = todayReadings.reduce((acc, curr) => acc + curr.timeSpent, 0);
        if (timeSpent < 900) { // 15 minutes
            unlockAchievement("speed_reader");
        }
    }

    // Check night owl
    if (now.getHours() >= 0 && now.getHours() < 5) {
        unlockAchievement("night_owl");
    }

    // Check weekend scholar
    const weekendReadings = Object.values(stats).filter(p => {
        const date = new Date(p.lastRead);
        return date.getDay() === 0 || date.getDay() === 6;
    });
    
    if (weekendReadings.length > 0) {
        unlockAchievement("weekend_scholar");
    }
}

function unlockAchievement(id: string) {
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (achievement && !achievements().some(a => a.id === id)) {
        setAchievements(prev => [...prev, { ...achievement, unlockedAt: new Date().toISOString() }]);
        // Aquí podrías disparar una notificación o animación
    }
}

export function saveProgress() {
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(STORAGE_KEY.PROGRESS, JSON.stringify(readingProgress()));
            localStorage.setItem(STORAGE_KEY.STREAK, JSON.stringify(streak()));
            localStorage.setItem(STORAGE_KEY.ACHIEVEMENTS, JSON.stringify(achievements()));
        } catch (error) {
            console.warn('Failed to save progress:', error);
        }
    }
}

export function loadProgress() {
    if (typeof window !== 'undefined') {
        try {
            const savedProgress = localStorage.getItem(STORAGE_KEY.PROGRESS);
            const savedStreak = localStorage.getItem(STORAGE_KEY.STREAK);
            const savedAchievements = localStorage.getItem(STORAGE_KEY.ACHIEVEMENTS);

            if (savedProgress) setReadingProgress(JSON.parse(savedProgress));
            if (savedStreak) setStreak(JSON.parse(savedStreak));
            if (savedAchievements) setAchievements(JSON.parse(savedAchievements));
        } catch (error) {
            console.warn('Failed to load progress:', error);
        }
    }
}
