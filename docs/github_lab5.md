# №5 зертханалық — Git және GitHub

Талаптар: жаңа бос repository, README, кемінде 3 commit, branch, Pull Request, merge, 3 Issue.

**GitHub-қа тек өзіңіз орындаған қадамдарды көрсетіңіз.** Бұл ZIP ішінде жалған commit немесе Pull Request жоқ. Әр қадамды нақты орындаңыз.

VS Code терминалында жоба қалтасын ашқаннан кейін:

```powershell
git init
git branch -M main
git add README.md docs .gitignore
git commit -m "docs: кинотеатр жобасының сипаттамасы"
git add sql
git commit -m "db: кинотеатр кестелері және зертханалық SQL"
git add server public tests package.json .env.example
git commit -m "web: фильмдер, сеанстар және сұрыптау"
git remote add origin https://github.com/Syrym1234/cinema-information-system1.git
git push -u origin main
```

> Егер `git init` бұрын жасалған болса немесе remote `origin` бар болса, команданы қайталамаңыз. `git status`, `git remote -v` арқылы тексеріңіз.

Нақты өзгеріспен branch, Pull Request орындау үлгісі:

```powershell
git switch -c feature/readme-examples
```

README.md файлына өз скриншотыңыздың атауын немесе SQL сұрыптауды қалай түсінгеніңіз туралы 2–3 сөйлем қосыңыз.

```powershell
git add README.md
git commit -m "docs: SQL сұрыптау мысалдарын нақтылау"
git push -u origin feature/readme-examples
```

GitHub -> Pull requests -> New pull request -> base `main`, compare `feature/readme-examples` -> Create -> Merge pull request.

3 Issue-ге мысал: (1) SQL деректерін SSMS-ке енгізу, (2) сеанс сұрыптауын тексеру, (3) билет брондауын тексеру. Әр Issue-ді нақты тапсырманы орындаған соң жабыңыз.
