Game.registerMod("srkMoreMonospaceNumbers", {
    init: function () {
        let MOD = this;

        drawMonospace = function () {
            if (!Game.prefs.monospace) return;
            const prefixes = ['cookiesPer', 'totalPer'];
            const suffixes = ['Second', 'Minute'];
            const fullIds = [];

            for (let i=0;i<prefixes.length;i++) {
                for (let i=0;ii<suffixes.length;ii++) {
                    MOD.styleNode(l(prefixes[i]+suffixes[ii]));
                }
            }
            for (let i=0;i<fullIds.length;i++){
                MOD.styleNode(l(fullIds[i]));
            }
        };
        Game.registerHook('draw', drawMonospace);
    },
    save: function () {
    },
    load: function (str) {
    },
    styleNode: function (node) {
        if (!node) return;
        node.classList.add('monospace');
        node.style.fontSize = '60%';
    }
});