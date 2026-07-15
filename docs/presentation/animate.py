#!/usr/bin/env python3
"""Inject slide transitions + entrance animations into a pptxgenjs deck.

Per slide config: skip N initial shapes (backgrounds/titles), then animate the
rest in groups. Each group fades in together, 450ms after the previous group,
starting automatically after the slide transition.
"""
import re, sys, zipfile, shutil, os

SRC = "CustomTees_Leadership_Demo.pptx"
OUT = "CustomTees_Leadership_Demo_animated.pptx"

# slide number -> (skip, [group sizes])
CONFIG = {
    1:  (3, [2, 1, 1, 1, 1]),
    2:  (3, [1, 1, 4, 4, 4, 4]),
    3:  (3, [4, 4, 4, 4, 1]),
    4:  (3, [1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1]),
    5:  (3, [4, 1, 4, 1, 4, 4, 1, 4, 1, 2]),
    6:  (3, [4, 1, 4, 1, 4, 1, 4, 3]),
    7:  (3, [4, 1, 4, 1, 4, 1, 4, 1, 3, 3, 3]),
    8:  (3, [4, 3, 3, 3, 3, 3]),
    9:  (3, [4, 4, 4, 4, 1]),
    10: (3, [2, 1, 1, 1, 1]),
}

TRANSITION = '<p:transition spd="med"><p:fade/></p:transition>'


def effect_par(cid, spid, delay, node_type):
    return f'''<p:par><p:cTn id="{cid}" presetID="10" presetClass="entr" presetSubtype="0" fill="hold" grpId="0" nodeType="{node_type}"><p:stCondLst><p:cond delay="{delay}"/></p:stCondLst><p:childTnLst><p:set><p:cBhvr><p:cTn id="{cid+1}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set><p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="{cid+2}" dur="400"/><p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cBhvr></p:animEffect></p:childTnLst></p:cTn></p:par>'''


def timing_xml(anim):
    """anim: list of (spid, group_index)"""
    cid = 5
    effects = []
    for n, (spid, g) in enumerate(anim):
        nt = "afterEffect" if n == 0 else "withEffect"
        effects.append(effect_par(cid, spid, g * 450, nt))
        cid += 3
    inner = "".join(effects)
    builds = "".join(f'<p:bldP spid="{spid}" grpId="0"/>' for spid, _ in anim)
    return (
        '<p:timing><p:tnLst><p:par>'
        '<p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
        '<p:seq concurrent="1" nextAc="seek">'
        '<p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>'
        '<p:par><p:cTn id="3" fill="hold">'
        '<p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst>'
        '<p:childTnLst><p:par><p:cTn id="4" fill="hold">'
        '<p:stCondLst><p:cond delay="0"/></p:stCondLst>'
        f'<p:childTnLst>{inner}</p:childTnLst>'
        '</p:cTn></p:par></p:childTnLst>'
        '</p:cTn></p:par>'
        '</p:childTnLst></p:cTn>'
        '<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
        '<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst>'
        '</p:seq>'
        '</p:childTnLst></p:cTn>'
        f'</p:par></p:tnLst><p:bldLst>{builds}</p:bldLst></p:timing>'
    )


def main():
    workdir = "anim_unpacked"
    if os.path.exists(workdir):
        shutil.rmtree(workdir)
    with zipfile.ZipFile(SRC) as z:
        names = z.namelist()
        z.extractall(workdir)

    for num, (skip, groups) in CONFIG.items():
        path = os.path.join(workdir, f"ppt/slides/slide{num}.xml")
        xml = open(path, encoding="utf-8").read()
        ids = re.findall(r'<p:cNvPr id="(\d+)"', xml)
        shape_ids = ids[1:]  # drop spTree group id
        content = shape_ids[skip:]
        expected = sum(groups)
        if len(content) != expected:
            print(f"slide{num}: WARNING expected {expected} shapes, found {len(content)}")
        anim = []
        idx = 0
        for g, size in enumerate(groups):
            for _ in range(size):
                if idx < len(content):
                    anim.append((content[idx], g))
                    idx += 1
        inject = TRANSITION + timing_xml(anim)
        assert "</p:sld>" in xml and "<p:timing>" not in xml
        xml = xml.replace("</p:sld>", inject + "</p:sld>")
        open(path, "w", encoding="utf-8").write(xml)
        print(f"slide{num}: animated {len(anim)} shapes in {len(groups)} groups")

    if os.path.exists(OUT):
        os.remove(OUT)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for root, _, files in os.walk(workdir):
            for f in files:
                full = os.path.join(root, f)
                z.write(full, os.path.relpath(full, workdir))
    print("wrote", OUT)


if __name__ == "__main__":
    main()
