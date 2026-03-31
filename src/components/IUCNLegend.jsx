import { useState } from 'react';

var CATS = [
  { code: "CR", fr: "En danger critique", en: "Critically Endangered", color: "#cc3333" },
  { code: "EN", fr: "En danger", en: "Endangered", color: "#e67e22" },
  { code: "VU", fr: "Vulnérable", en: "Vulnerable", color: "#f39c12" },
  { code: "NT", fr: "Quasi menacé", en: "Near Threatened", color: "#6b8e23" },
  { code: "LC", fr: "Préoccupation mineure", en: "Least Concern", color: "#27ae60" },
  { code: "DD", fr: "Données insuffisantes", en: "Data Deficient", color: "#999" },
];

export default function IUCNLegend(props) {
  var lang = props.lang || "fr";
  var _s = useState(false), open = _s[0], setOpen = _s[1];

  return (
    <div style={{ margin: "8px 0" }}>
      <button onClick={function () { setOpen(!open); }}
        style={{ fontSize: 11, color: "var(--text3)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 13 }}>{open ? "▾" : "▸"}</span>
        <span>{lang === "fr" ? "Légende UICN" : "IUCN Legend"}</span>
      </button>
      {open && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", padding: "6px 0 2px 18px" }}>
          {CATS.map(function (c) {
            return (
              <div key={c.code} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ display: "inline-block", padding: "1px 5px", borderRadius: 3, fontSize: 10, fontWeight: 700, background: c.color + "20", color: c.color }}>{c.code}</span>
                <span style={{ fontSize: 10, color: "var(--text2)" }}>{c[lang]}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
