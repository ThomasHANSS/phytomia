var SUB = { fr: "Explorateur d'interactions plantes × insectes en Europe", en: "Plant × insect interaction explorer for Europe" };

export default function Header(props) {
  var lang = props.lang, setLang = props.setLang, onLogoClick = props.onLogoClick;
  return (
    <div className="header">
      <div className="header-logo" onClick={onLogoClick}>
        <h1 className="header-title">
          <span style={{ color: '#2d7d46' }}>Phyto</span>
          <span style={{ color: '#b8860b' }}>mia</span>
        </h1>
        <p className="header-sub">{SUB[lang]}</p>
      </div>
      <button className="lang-btn" onClick={function () { setLang(lang === 'fr' ? 'en' : 'fr'); }}>
        {lang === 'fr' ? 'EN' : 'FR'}
      </button>
    </div>
  );
}
