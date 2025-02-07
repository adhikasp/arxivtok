import { Component, Show } from "solid-js";

interface AchievementToastProps {
    title: string;
    description: string;
    icon: string;
    show: boolean;
}

export const AchievementToast: Component<AchievementToastProps> = (props) => {
    return (
        <Show when={props.show}>
            <div 
                class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50
                       bg-white/95 backdrop-blur-md shadow-lg rounded-xl
                       p-4 min-w-[300px] animate-achievement"
            >
                <div class="flex items-center gap-3">
                    <span class="text-3xl">{props.icon}</span>
                    <div>
                        <h3 class="font-medium text-gray-900">
                            {props.title}
                        </h3>
                        <p class="text-sm text-gray-500">
                            {props.description}
                        </p>
                    </div>
                </div>
            </div>
        </Show>
    );
};
