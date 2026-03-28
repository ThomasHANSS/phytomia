var L = { fr: "Données sous licence", en: "Data licensed under" };

export default function Footer(props) {
  var lang = props.lang, lastUpdated = props.lastUpdated;
  return (
    <div className="footer">
      <p>
        {L[lang] || L.fr}{' '}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>
        {' · '}Phytomia v1.0 · Thomas Hanss
        {' · '}Photos: Wikimedia
        {lastUpdated ? ' · ' + (lang === 'fr' ? 'Maj' : 'Updated') + ': ' + lastUpdated.slice(0, 10) : ''}
      </p>
    </div>
  );
}
