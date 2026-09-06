# Impact Training - Stage 1

This ZIP is a patch for the already-clean project. Extract it directly over the project root and keep the folder structure exactly as shown.

## Included

- Reliable client session recovery through the existing temporary browser data layer.
- A real trainee account page with profile, company, English name and enrollments.
- English first/last name fields during registration and trainee administration.
- Public recorded-course purchase flow with enrollment gating.
- Public training booking flow.
- Corporate/company groups with trainee membership management.
- Manual corporate orders with company, responsible person and actual sold price.
- Training-course detail page with city/mode selection and sorted dates.

## Validation

After copying the files:

```powershell
npm.cmd exec tsc -- --noEmit
npm.cmd run dev
```

No new npm packages are required.
