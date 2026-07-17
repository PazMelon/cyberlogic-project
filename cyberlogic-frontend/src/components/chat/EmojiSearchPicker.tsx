import { useState } from "react";
import { X } from "lucide-react";

export interface EmojiSearchPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const ALL_EMOJIS_BY_CATEGORY: Record<string, string[]> = {
  "Smileys & Emotion": ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😻", "😼", "😽", "🙀", "😿", "😾"],
  "People & Body": ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄", "💋", "🩸"],
  "Animals & Nature": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦢", "🦉", "🦤", "🦩", " peacock", "🦚", " parrot", "🦜", "🐸", "🐊", "🐢", "🦎", "🐍", "🐲", "🐉", "🦕", "🦖", "🐳", "🐋", "🐬", "🦭", "🐟", "🐠", "🐡", "🦈", "🐙", "🐚", "🐌", "🦋", "🐛", "🐜", "🐝", "🪲", "🐞", "🦗", "🕷️", "🕸️", "🦂", "🦟", "🪰", "🪱", "🦠", "💐", "🌸", "💮", "🏵️", "🌹", "🥀", "🌺", "🌻", "🌼", "🌷", "🌱", "🪴", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "🍀", "🍁", "🍂", "🍃"],
  "Food & Drink": ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", " melon", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🥞", "🧇", "🧀", "🍖", "🍗", "🥩", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🫓", "🥙", "🧆", "🥚", "🍳", "🥘", "🍲", "🫕", "🥣", "🥗", "🍿", "🧈", "🧂", "🥫", "🍱", "🍘", "🍙", "🍚", "🍛", "🍜", "🍝", "🍠", "🍢", "🍣", "🍤", "🍥", "🦪", "🍡", "🥟", "🥠", "🥡", "🍦", "🍧", "🍨", "🍩", "🍪", "🎂", "🍰", "🧁", "🥧", "🍫", "🍬", "🍭", "🍮", "🍯", "🍼", "🥛", "☕", "𫖖", "🍵", "🍶", "🍾", "🍷", "🍸", "🍹", "🍺", "🍻", "🥂", "🥃", "🥤", "🧋", "🧃", "🧉", "🧊"],
  "Travel & Places": ["🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🛵", "🏍️", "🛺", "🚲", "🛴", "🛹", "🛼", "🚨", "🚔", "🚍", "🚘", "🚖", "🚡", "🚠", "🚟", "🚃", "🚋", "🚞", "🦼", "🦽", "🚂", "🚆", "🚇", "🚊", "🚉", "✈️", "🛫", "🛬", "🛩️", "🛞", "🚢", "🛳️", "⛴️", "🚤", "🛥️", "🛳️", "🗺️", "🏔️", "⛰️", "🌋", "🗻", "🏕️", "🏖️", "🏜️", "🏝️", "🏞️", "🏟️", "🏛️", "🏗️", "🧱", "🏘️", "🏚️", "🏠", "🏡", "🏢", "🏣", "🏤", "🏥", "🏦", "🏨", "🏩", "🏪", "🏫", "🏬", "🏭", "🏯", "🏰", "💒", "🗼", "🗽", "🕌", "⛪", "🛕", "🕋", "⛩️", "🌅", "🌄", "🌌", "🌉", "🎠", "🎡", "🎢"]
};

export default function EmojiSearchPicker({ onSelectEmoji, onClose }: EmojiSearchPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Smileys & Emotion");

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center z-[200] p-0 sm:p-4 animate-fadeIn">
      <div className="bg-surface-900 border-t sm:border border-border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm h-[60vh] sm:h-auto sm:max-h-[420px] flex flex-col shadow-2xl p-4 sm:p-5 animate-slideUp sm:animate-scaleIn overflow-hidden">
        {/* Mobile drag handle */}
        <div className="sm:hidden w-12 h-1 bg-surface-700 rounded-full mx-auto mb-2.5 flex-shrink-0" />
        <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-2">
          <span className="text-xs font-bold text-text-primary">React with any emoji</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <input
          type="text"
          placeholder="Search emoji..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface-800 border border-border focus:border-primary/50 text-xs text-text-primary placeholder:text-text-muted rounded-xl px-3 py-2 focus:outline-none mb-3"
        />

        {!searchQuery ? (
          <>
            {/* Category tabs using flex wrap layout to avoid scrollbar and ensure clean visual look */}
            <div className="flex flex-wrap gap-1.5 mb-3 border-b border-border/20 pb-2">
              {Object.entries({
                "Smileys & Emotion": "😀 Smileys",
                "People & Body": "👋 People",
                "Animals & Nature": "🐶 Animals",
                "Food & Drink": "🍔 Food",
                "Travel & Places": "✈️ Travel"
              }).map(([category, label]) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer ${
                    activeCategory === category
                      ? "bg-primary text-white shadow-xs"
                      : "bg-surface-800 text-text-muted hover:text-text-primary hover:bg-surface-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-6 gap-2 p-1 min-h-[180px]">
              {ALL_EMOJIS_BY_CATEGORY[activeCategory].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onSelectEmoji(emoji)}
                  className="w-full aspect-square text-lg flex items-center justify-center rounded-lg hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto grid grid-cols-6 gap-2 p-1 min-h-[180px]">
            {Object.values(ALL_EMOJIS_BY_CATEGORY)
              .flat()
              .filter((emoji) => emoji.includes(searchQuery))
              .slice(0, 36)
              .map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onSelectEmoji(emoji)}
                  className="w-full aspect-square text-lg flex items-center justify-center rounded-lg hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
