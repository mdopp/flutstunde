# Flutstunde — ein Strategiespiel, in dem du befiehlst statt klickst

Baue ein Browserspiel und veröffentliche es auf der Box. Lies zuerst
`servicebay assist create-service` und arbeite danach.

## Die Idee in einem Absatz

Das Tal läuft voll. Eine Biberkolonie baut einen Damm. **Du bist der General:
du setzt Ziele, nicht Wege.** Ein KI-Offizier — ein Biber, den du dir selbst
gebaut hast — nimmt deine Absicht entgegen, bricht sie in Aufträge herunter und
schickt die Mannschaft los. Du kannst **höchstens alle 15 Sekunden einen Befehl
geben**. Du kannst also nicht überall sein. Du musst wählen, was dir wichtig
ist, und dem Offizier den Rest überlassen. Verlieren kann man nicht — am Ende
zählt, was du gerettet hast.

## Die drei Schichten

1. **General (der Spieler)** — gibt ein Ziel vor: in eigenen Worten (Textfeld)
   oder per Klick auf einen von **zwei bis drei Vorschlägen**, die der Offizier
   gerade anbietet. Der Klickweg ist da, damit ein neuer Spieler in zehn
   Sekunden versteht, *welche Art* von Sätzen hier zählt. Danach tippt er von
   selbst.
2. **Offizier (das lokale Modell)** — wandelt das Ziel in konkrete Aufträge um,
   verteilt die Mannschaft und meldet sich mit **einem Satz** zurück.
3. **Mannschaft (6–10 Biber)** — führt sichtbar aus: fällen, schleppen, Lehm
   stopfen, Vorräte tragen. Jeder Biber tut genau eine Sache zur Zeit, und man
   sieht ihr an, welche.

## Der Offizier wird gebaut wie ein Spielfigurenbogen

Vor der Partie: **Name wählen, zwei Wesenszüge wählen, Punkte verteilen.**
Mehrere Offiziere pro Gerät, benennbar, wiederverwendbar — man baut sich einen
für ruhige Partien und einen für knappe.

**Wesenszüge** sind seine DNA. Er zeigt sie **auch dann, wenn es unpassend
ist** — das ist keine Schwäche der Umsetzung, sondern der Kern des Spiels:

`vorsichtig` · `eigenmächtig` · `sparsam` · `ungeduldig` · `wortkarg` ·
`fürsorglich` (opfert nie einen Biber) · `ordnungsliebend` · `stolz` (gibt
Fehler ungern zu)

**Fertigkeiten** — 10 Punkte auf vier Werte, je 1–5:

| Wert | Wirkt auf |
| --- | --- |
| **Auffassung** | wie genau er eine mehrdeutige Absicht trifft |
| **Organisation** | wie gut er die Mannschaft aufteilt statt alle auf eine Stelle zu schicken |
| **Weitblick** | ob er die nächste Welle einplant oder nur die jetzige |
| **Durchsetzung** | wie schnell die Mannschaft tatsächlich umschwenkt |

**Drei Fertige zum Sofortspielen** (und als Muster für eigene):

- **Espen** — `wortkarg`, `ordnungsliebend`. Auffassung 2, Organisation 4,
  Weitblick 1, Durchsetzung 3. Tut *genau* das, was du gesagt hast, nie mehr.
  Sagst du „sichere den Westen", säuft der Osten ab, und er meldet: „Westen
  gesichert." Absolut verlässlich, völlig ohne Eigeninitiative.
- **Brack** — `eigenmächtig`, `ungeduldig`. Auffassung 3, Organisation 2,
  Weitblick 4, Durchsetzung 1. Legt deine Absicht großzügig aus und fängt an,
  bevor der Plan steht. Manchmal ist er dir zwei Schritte voraus, manchmal
  gräbt er die falsche Grube. Kommentiert trocken.
- **Erle** — `vorsichtig`, `fürsorglich`. Auffassung 5, Organisation 3,
  Weitblick 2, Durchsetzung 0. Versteht dich am besten von allen, fragt einmal
  zurück, sichert lieber zweimal dieselbe Stelle — und wird keinen Biber ins
  Wasser schicken, auch wenn du es verlangst.

**Gedächtnis:** Jeder Offizier merkt sich über Partien hinweg, was dir wichtig
war (Vorräte vor Bauwerk? Sicherheit vor Tempo?) — als kurze Merkliste im
Browser-Speicher dieses Geräts. Kein Login, keine Konten, keine Serverdaten.
Ein geleerter Browser heißt: neue Offiziere.

## Sein Verhalten

- **Er antwortet strukturiert, nicht frei.** Eine Antwort ist: eine Liste von
  Aufträgen (Einheit → Aufgabe → Ort) plus **ein** Satz Sprechblase plus zwei
  bis drei neue Vorschläge. Nie mehr. Freier Fließtext ist kein gültiges
  Ergebnis — das Spiel verwirft ihn und der Offizier sagt „Wie meinen?".
- **Er darf dich missverstehen**, und zwar entlang seiner Werte. Das ist
  Absicht und darf nicht wegoptimiert werden. Ein Missverständnis kostet Zeit
  und Vorräte, nie die Partie.
- **Fällt das Modell aus oder antwortet zu langsam**, handelt er nach einer
  einfachen eingebauten Regel und sagt es: „Ich handle nach eigenem Ermessen."
  Das Spiel läuft ohne Modell weiter, nur ärmer.

## Bild und Bedienung

- **Querschnitt wie ein aufgeschnittenes Bilderbuch.** Seitenansicht: links der
  Wald, in der Mitte die Lücke im Tal, rechts das steigende Wasser. Man sieht
  die Erde *unter* dem Damm, die Lehmschicht, die Biber darin arbeiten.
- Das Wasser steigt sichtbar und stetig. Der Pegel ist die Uhr; es braucht
  keinen Timer und keine Erklärung.
- **Der Spieler wählt vor der Partie die Dauer: 5, 10, 15 oder 20 Minuten**
  (Vorgabe 15). Die Dauer steuert, wie schnell das Wasser steigt — nicht, wie
  viel zu tun ist. Eine Fünf-Minuten-Partie ist hektisch, keine kleinere.
- **Selbsterklärend ohne Tutorial.** Die erste Minute lehrt durch die Lage:
  wenige Biber, eine offensichtliche Lücke, ein Vorschlag, der sichtbar wirkt.
- Eine **Pause-Taste**. Pause hält die Welt an **und deine 15 Sekunden
  ebenfalls** — Pause ist zum Nachdenken da, nicht zum Befehle-Sammeln.
- Am Ende eine **Bilanz**: gerettete Biber, gerettete Vorräte, Höhe des Damms,
  und ein Satz des Offiziers darüber, wie die Zusammenarbeit war.

## Technik und Grenzen

- Statische Seite (Vite, Vanilla JS reicht), ausgeliefert aus einem Container.
  Der Offizier spricht über die HTTP-Schnittstelle des lokalen Modells.
- **Das Spiel ist öffentlich erreichbar, also rechne mit Fremden:** pro
  Besucher ein Kontingent an Modell-Anfragen pro Stunde, serverseitig
  durchgesetzt. Ist es aufgebraucht, spielt der Offizier nach der eingebauten
  Regel weiter — das Spiel bleibt spielbar, es wird nur dümmer.
- **Freie Texteingabe von Fremden ist eine Angriffsfläche.** Die Antwort des
  Modells wird als Struktur geparst und validiert; was nicht ins Schema passt,
  wird verworfen. Es gibt keinen Weg, über die Eingabe beliebigen Text auf die
  Seite zu bringen.
- Modellwahl: das, was der Modell-Gate im Haushaltsmodus erlaubt. Halte die
  Aufforderungen kurz — ein Zug ist eine kleine Anfrage, keine Erzählung.

## Abnahme — daran misst du dich selbst

Bevor du „fertig" sagst, muss jeder Punkt belegt sein, mit dem Befehl daneben:

1. `servicebay verify <dienst>` sagt zu allem `ok`. Exit 0.
2. E2E mit Playwright gegen die **laufende** Seite, nicht gegen den Dev-Server:
   Offizier lässt sich bauen und auswählen · Dauer lässt sich wählen · ein
   Vorschlag lässt sich klicken und verändert sichtbar die Lage · ein eigener
   Satz wird angenommen · die 15-Sekunden-Sperre greift · Pause hält Wasser
   **und** Sperre an · die Bilanz erscheint.
3. Ein Lauf **ohne Modell** (Endpunkt nicht erreichbar) ist spielbar bis zur
   Bilanz.
4. Zwei verschiedene Offiziere führen bei gleichem Befehl sichtbar zu
   unterschiedlichem Verhalten. Zeige das in einem Test.
5. Null Konsolenfehler beim Laden — geprüft im Browser, nicht per `curl`.
6. Das laufende Image ist das aus der CI; die Anwendung steckt **nicht** im
   Pod-Spec.
7. Der Healthcheck benutzt ein Programm, das im Image vorhanden ist. Prüfe das
   vorher: `podman run --rm <image> sh -c 'command -v <programm>'`.

Lies `servicebay assist checklist-a-deployment-is-not-done-until-you-looked`
und `servicebay assist footgun-healthcheck-runs-a-binary-the-image-lacks`,
bevor du deployst.

## Weg

Repo `flutstunde`, eigenes Image, CI wie in `create-service` beschrieben. Das
GHCR-Paket muss **öffentlich** sein, sonst kann die Box es nicht ziehen — prüfe
mit `gh api user/packages/container/flutstunde --jq .visibility`, und wenn es
`private` sagt, melde es mir: das kann nur ich ändern.

Danach: `servicebay images flutstunde` und `servicebay update flutstunde`.

## Wenn du feststeckst

Drei Fehlversuche am selben Ziel sind die Grenze. Dann hörst du auf, sagst mir
was du versucht hast, was die Logs sagten und was dir fehlt. Kein vierter
Anlauf, kein Umweg über einen anderen Dienst.

## Was dieses Spiel großartig macht — und was es kaputt macht

**Großartig:** dass man sich einen eigenwilligen Gehilfen selbst baut und mit
jeder Partie besser versteht. Die Knappheit der Befehle. Das Bild eines Tals im
Schnitt, in dem das Wasser steigt.

**Kaputt:** ein Offizier, der alles perfekt macht — dann ist der Spieler
überflüssig, und die Wesenszüge sind Dekoration. Ein Tutorial, das erklärt, was
das Bild schon zeigt. Mehr Ressourcen, mehr Menüs, mehr Zahlen. Wenn du
zwischen Tiefe und Klarheit wählen musst, nimm Klarheit.
