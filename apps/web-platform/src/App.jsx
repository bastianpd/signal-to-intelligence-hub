import React, { useState } from "react";
import TextStudio from "./simulators/TextStudio.jsx";
import SoundStudio from "./simulators/SoundStudio.jsx";
import ImageStudio from "./simulators/ImageStudio.jsx";
import AutomationStudio from "./simulators/AutomationStudio.jsx";
const TABS = [["Text & numbers", TextStudio], ["Sound", SoundStudio], ["Image", ImageStudio], ["ESP32 & email", AutomationStudio]];
export default function App() {
  const [i, setI] = useState(0);
  const Mod = TABS[i][1];
  return (<>
    <header><h1>Signal-to-Intelligence Hub</h1>
      <div className="pipe">Phenomenon → transduction → sampling &amp; quantization → bits / ASCII → logic &amp; automation</div></header>
    <nav role="tablist">{TABS.map(([n], k) => <button key={n} role="tab" aria-selected={k === i} onClick={() => setI(k)}>{n}</button>)}</nav>
    <main><Mod /></main></>);
}
