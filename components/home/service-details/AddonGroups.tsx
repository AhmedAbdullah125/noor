import React from "react";
import { Check } from "lucide-react";
import { ServiceAddonGroup } from "../../../types";
import { parsePrice } from "./utils";

type Props = {
    resolvedAddonGroups: ServiceAddonGroup[];
    selectedAddonIds: Set<string>;
    handleGroupOptionSelect: (groupId: string, optionId: string, type: "single" | "multi") => void;
    t: any;
    isAr: boolean;
    canSubscribe: boolean;
};

export const AddonGroups: React.FC<Props> = ({
    resolvedAddonGroups,
    selectedAddonIds,
    handleGroupOptionSelect,
    t,
    isAr,
    canSubscribe
}) => {
    const sortedGroups = React.useMemo(() => {
        return [...resolvedAddonGroups].sort((a, b) => {
            if (String(a.id) === "61") return -1;
            if (String(b.id) === "61") return 1;
            return 0;
        });
    }, [resolvedAddonGroups]);

    if (resolvedAddonGroups.length === 0) return null;

    return (
        <div className="px-6 mb-6 space-y-6">
            {sortedGroups.map((group) => (
                <div key={group.id}>
                    <div className="mb-3 flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-app-text">{isAr ? group.title_ar : group.title_en || group.title_ar}</h3>
                        {(group as any).required && (
                            <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-md font-semibold">{t.required}</span>
                        )}
                    </div>
                    <div className="space-y-2">
                        {(group.options ?? []).map((option: any) => {
                            const isSelected = selectedAddonIds.has(option.id);
                            const isRadio = (group as any).type === "single";

                            return (
                                <div
                                    key={option.id}
                                    onClick={() => handleGroupOptionSelect(String(group.id), option.id, (group as any).type)}
                                    className={`flex relative items-center justify-between p-3.5 pb-8 rounded-2xl border cursor-pointer transition-all active:scale-[0.99] ${isSelected ? "bg-app-gold/5 border-app-gold shadow-sm" : "bg-white border-app-card/30 hover:border-app-card"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {isRadio ? (
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "border-app-gold" : "border-app-textSec/30"
                                                    }`}
                                            >
                                                {isSelected && <div className="w-2.5 h-2.5 bg-app-gold rounded-full" />}
                                            </div>
                                        ) : (
                                            <div
                                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-app-gold border-app-gold" : "border-app-textSec/30"
                                                    }`}
                                            >
                                                {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                            </div>
                                        )}

                                        <div>
                                            <p className={`text-sm font-semibold ${isSelected ? "text-app-gold" : "text-app-text"}`}>{isAr ? option.title_ar : option.title_en || option.title_ar}</p>
                                            {(isAr ? option.desc_ar : option.desc_en) && <p className="text-[10px] text-app-textSec">{isAr ? option.desc_ar : option.desc_en}</p>}
                                        </div>
                                    </div>

                                    <span className="text-[10px] absolute bottom-1 end-1 font-bold text-white bg-app-gold px-2.5 py-1 rounded-lg">
                                        +{parsePrice(option.price_kwd ?? option.price ?? 0).toFixed(3)} {t.currency}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {!canSubscribe && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-3 text-[12px] font-semibold mt-4">
                    {t.selectRequired}
                </div>
            )}
        </div>
    );
};
