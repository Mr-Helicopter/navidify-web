import React from 'react';
import { X, Sliders, RotateCcw } from 'lucide-react';
import { EQ_FREQUENCIES, EQ_PRESETS } from '../../player/eqPresets';
import { usePlayerStore } from '../../state/usePlayerStore';

export const EqualizerModal: React.FC = () => {
  const {
    isEqModalOpen,
    toggleEqModal,
    eqEnabled,
    toggleEq,
    eqGains,
    setEqGain,
    activeEqPreset,
    setEqPreset,
  } = usePlayerStore();

  if (!isEqModalOpen) return null;

  const formatFreq = (freq: number) => {
    return freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-xl bg-[#242424] border border-[#3e3e3e] rounded-xl shadow-2xl p-6 text-white animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#3e3e3e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[#1db954]/20 text-[#1db954]">
              <Sliders size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold">10-Band Graphic Equalizer</h2>
              <p className="text-xs text-[#b3b3b3]">Fine-tune acoustic frequency response</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* EQ On/Off toggle switch */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <span className={eqEnabled ? 'text-[#1db954]' : 'text-gray-400'}>
                {eqEnabled ? 'ENABLED' : 'BYPASSED'}
              </span>
              <input
                type="checkbox"
                checked={eqEnabled}
                onChange={(e) => toggleEq(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-[#3e3e3e] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1db954] relative"></div>
            </label>

            <button
              onClick={() => toggleEqModal(false)}
              className="text-[#b3b3b3] hover:text-white p-1 rounded-full hover:bg-[#333] transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Presets & Reset Row */}
        <div className="flex items-center justify-between mt-5 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#b3b3b3]">Preset:</span>
            <select
              value={activeEqPreset}
              onChange={(e) => setEqPreset(e.target.value)}
              className="bg-[#181818] border border-[#3e3e3e] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1db954] cursor-pointer"
            >
              {Object.keys(EQ_PRESETS).map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
              {activeEqPreset === 'Custom' && <option value="Custom">Custom</option>}
            </select>
          </div>

          <button
            onClick={() => setEqPreset('Flat')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#333] hover:bg-[#444] text-xs font-medium text-[#b3b3b3] hover:text-white transition-colors"
          >
            <RotateCcw size={13} />
            Reset to Flat
          </button>
        </div>

        {/* 10-Band Sliders Grid */}
        <div className={`grid grid-cols-10 gap-2 h-56 pt-2 pb-1 transition-opacity ${eqEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          {EQ_FREQUENCIES.map((freq, idx) => {
            const gain = eqGains[idx] || 0;
            return (
              <div key={freq} className="flex flex-col items-center justify-between h-full">
                {/* dB Value Indicator */}
                <span className="text-[11px] font-mono text-[#b3b3b3]">
                  {gain > 0 ? `+${gain}` : `${gain}`}
                </span>

                {/* Vertical Range Slider */}
                <div className="relative flex items-center justify-center h-36 w-6">
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={gain}
                    onChange={(e) => setEqGain(idx, parseFloat(e.target.value))}
                    className="w-36 h-2 bg-[#3e3e3e] rounded-lg appearance-none cursor-pointer -rotate-90 origin-center accent-[#1db954]"
                    style={{ margin: 0 }}
                  />
                </div>

                {/* Frequency Label */}
                <span className="text-[11px] font-medium text-[#eaeaea] mt-1">
                  {formatFreq(freq)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Range bounds hint */}
        <div className="flex justify-between text-[10px] text-[#777] mt-3 border-t border-[#333] pt-2 px-1">
          <span>+12 dB (Boost)</span>
          <span>0 dB (Unity)</span>
          <span>-12 dB (Cut)</span>
        </div>
      </div>
    </div>
  );
};
