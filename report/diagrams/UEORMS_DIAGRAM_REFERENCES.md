# UEORMS Diagram References

## Use Case Diagram (Current Active)
- PlantUML: `report/diagrams/UEORMS_FULL_USE_CASE_DIAGRAM.puml`
- Draw.io: `report/diagrams/UEORMS_FULL_USE_CASE_DIAGRAM.drawio`
- Draw.io alias (IDE tab): `report/diagrams/UEORMS_Comprehensive_Diagrams.drawio`

## Use Case Diagram (Detailed Backup)
- PlantUML: `report/diagrams/UEORMS_FULL_USE_CASE_DIAGRAM_DETAILED.puml`
- Draw.io: `report/diagrams/UEORMS_FULL_USE_CASE_DIAGRAM_DETAILED.drawio`

## Full Sequence Diagram (Master Enterprise Flow)
- PlantUML: `report/diagrams/UEORMS_FULL_SEQUENCE_DIAGRAM.puml`
- Coverage note: `report/diagrams/UEORMS_FULL_SEQUENCE_DIAGRAM_COVERAGE.md`

## Full Activity Diagram (Master Enterprise Flow)
- PlantUML: `report/diagrams/UEORMS_FULL_ACTIVITY_DIAGRAM.puml`
- Coverage note: `report/diagrams/UEORMS_FULL_ACTIVITY_DIAGRAM_COVERAGE.md`

## Full Navigation Chart (Master UI Navigation)
- PlantUML: `report/diagrams/UEORMS_FULL_NAVIGATION_CHART.puml`
- Coverage note: `report/diagrams/UEORMS_FULL_NAVIGATION_CHART_COVERAGE.md`

## Module-wise Sequence Diagrams (Split from Master)
- Directory: `report/diagrams/sequence_modules/`
- Index: `report/diagrams/sequence_modules/README.md`
- Total split files: 15 (`01_...puml` to `15_...puml`)

## Full Class Diagram (Auto-generated from Prisma Schema)
- PlantUML: `report/diagrams/UEORMS_FULL_CLASS_DIAGRAM.puml`
- Draw.io: `report/diagrams/UEORMS_FULL_CLASS_DIAGRAM.drawio`
- Summary: `report/diagrams/UEORMS_FULL_CLASS_DIAGRAM_SUMMARY.md`

## Full ER Diagram (Auto-generated from Prisma Schema)
- PlantUML: `report/diagrams/UEORMS_FULL_ER_DIAGRAM.puml`
- Mermaid: `report/diagrams/UEORMS_FULL_ER_DIAGRAM.mmd`
- Draw.io: `report/diagrams/UEORMS_FULL_ER_DIAGRAM.drawio`
- Summary: `report/diagrams/UEORMS_FULL_ER_DIAGRAM_SUMMARY.md`

## Supporting Analysis
- `report/diagrams/UEORMS_USE_CASE_ANALYSIS.md`
- `report/diagrams/UEORMS_ROUTE_INVENTORY.md`
- `report/old_project_report_extracted.txt`

## Note
- Full sequence diagram is generated from route orchestration + workflow docs + report scope and is intentionally comprehensive.
- Split sequence diagrams are readability-focused views derived from the master sequence.
- Full ER diagram covers all parsed Prisma entities and FK-owner relations.
- Source alignment verified against `old_project_report.docx` claim of 125 database models.
