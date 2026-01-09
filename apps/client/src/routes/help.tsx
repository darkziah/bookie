import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/layout/auth-guard";
import { SidebarProvider, SidebarInset } from "@bookie/ui/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bookie/ui/components/ui/card";
import {
  IconBook,
  IconUsers,
  IconQrcode,
  IconPackage,
  IconShieldLock,
  IconInfoCircle,
  IconListCheck,
  IconHelp,
  IconSettings,
} from "@tabler/icons-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@bookie/ui/components/ui/accordion";
import { Separator } from "@bookie/ui/components/ui/separator";

export const Route = createFileRoute("/help")({
  component: HelpPage,
});

function HelpPage() {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold">Help & Documentation</h1>
              <p className="text-muted-foreground text-lg">
                Guides, workflows, and reference material for the Bookie Library System.
              </p>
            </div>

            {/* Quick Start Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconQrcode className="h-5 w-5 text-primary" />
                    Circulation
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  Learn how to check out books, handle returns, and manage student borrowing limits.
                </CardContent>
              </Card>
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconBook className="h-5 w-5 text-primary" />
                    Cataloging
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  Add new books via ISBN lookup, manage copies, and organize your collection.
                </CardContent>
              </Card>
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconPackage className="h-5 w-5 text-primary" />
                    Inventory
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  Run system-wide audits to track missing or misplaced books efficiently.
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Main Content Area */}
            <div className="grid gap-8 lg:grid-cols-[1fr_250px]">
              <div className="space-y-8">

                {/* section: WORKFLOWS */}
                <section id="workflows" className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      <IconListCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Common Workflows</h2>
                      <p className="text-muted-foreground">Step-by-step guides for daily tasks.</p>
                    </div>
                  </div>

                  <Accordion type="single" collapsible className="w-full border rounded-lg bg-card">
                    <AccordionItem value="flow-checkout">
                      <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
                        <span className="font-semibold">How to Check Out Books</span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 prose dark:prose-invert max-w-none">
                        <ol className="list-decimal pl-4 space-y-2 mt-2">
                          <li>Navigate to the <strong>Circulation</strong> page via the sidebar.</li>
                          <li>
                            <strong>Identify the Student:</strong>
                            <ul className="list-disc pl-4 mt-1 text-muted-foreground">
                              <li>Scan the Student ID barcode, OR</li>
                              <li>Type their name/ID in the search box and select them from the dropdown.</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Verify Status:</strong>
                            <p className="mt-1 text-muted-foreground">Check for any "Blocked" status or overdue books. The system will alert you if the student has reached their borrowing limit.</p>
                          </li>
                          <li>
                            <strong>Scan Books:</strong>
                            <p className="mt-1 text-muted-foreground">Scan the barcode on the back of each book. The book will appear in the "Current Session" list.</p>
                          </li>
                          <li>
                            <strong>Complete:</strong>
                            <p className="mt-1 text-muted-foreground">Click "Finish Checkout" verify the due dates. The receipt summary will be displayed.</p>
                          </li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="flow-add-book">
                      <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
                        <span className="font-semibold">Adding New Books to Catalog</span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 prose dark:prose-invert max-w-none">
                        <ol className="list-decimal pl-4 space-y-2 mt-2">
                          <li>Go to the <strong>Catalog</strong> page and click the "Add Book" button.</li>
                          <li>
                            <strong>ISBN Lookup (Recommended):</strong>
                            <p className="mt-1 text-muted-foreground">
                              Enter or scan the ISBN-13/ISBN-10. Click "Lookup" to automatically fetch Title, Author, Publisher, and Cover image from online databases.
                            </p>
                          </li>
                          <li>
                            <strong>Manual Entry:</strong>
                            <p className="mt-1 text-muted-foreground">
                              If ISBN lookup fails, fill in the Title, Author, and Category manually.
                            </p>
                          </li>
                          <li>
                            <strong>Asset Details:</strong>
                            <ul className="list-disc pl-4 mt-1 text-muted-foreground">
                              <li><strong>Accession Number:</strong> The system auto-generates this, but you can override it if tagging retroactively.</li>
                              <li><strong>Location:</strong> Enter the shelf location (e.g., "FIC-ROW1").</li>
                            </ul>
                          </li>
                          <li>Click "Add Book" to save.</li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="flow-inventory">
                      <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
                        <span className="font-semibold">Running an Inventory Audit</span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 prose dark:prose-invert max-w-none">
                        <div className="space-y-4 pt-2">
                          <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-200 dark:border-amber-800 text-sm">
                            <strong>Note:</strong> Inventory is best done when the library is closed to ensuring borrowing doesn't interfere with counts.
                          </div>
                          <ol className="list-decimal pl-4 space-y-2">
                            <li>Navigate to <strong>Inventory</strong> and click "New Report".</li>
                            <li>Give the report a name (e.g., "Year End 2025") and click "Start".</li>
                            <li>
                              <strong>Scanning Phase:</strong>
                              <ul className="list-disc pl-4 mt-1 text-muted-foreground">
                                <li>Bring a laptop/tablet and scanner to the shelves.</li>
                                <li>Scan every book on the shelf.</li>
                                <li>The system plays a sound for "Correct", "Missing", or "Misplaced" items.</li>
                              </ul>
                            </li>
                            <li>
                              <strong>Review:</strong>
                              <p className="mt-1 text-muted-foreground">
                                Check the "Missing Items" tab. These are books the system thinks should be there but weren't scanned.
                              </p>
                            </li>
                            <li>Click "Complete Inventory" to finalize the report and update book statuses.</li>
                          </ol>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </section>

                <Separator />

                {/* section: CONCEPTS */}
                <section id="concepts" className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <IconInfoCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Core Concepts</h2>
                      <p className="text-muted-foreground">Understanding the system terminology.</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Book Identifiers</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div>
                          <p className="font-semibold">ISBN</p>
                          <p className="text-muted-foreground">International Standard Book Number. Identifies the <em>edition</em> of a book. All copies of "Harry Potter 1" have the same ISBN.</p>
                        </div>
                        <Separator />
                        <div>
                          <p className="font-semibold">Accession Number</p>
                          <p className="text-muted-foreground">A unique ID for <em>each physical copy</em>. If you have 5 copies of a book, they have the same ISBN but 5 unique Accession Numbers.</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">User Roles</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div>
                          <p className="font-semibold">Student Assistants</p>
                          <p className="text-muted-foreground">Can perform Check-in/Check-out and view the catalog. Cannot delete books, change settings, or access staff data.</p>
                        </div>
                        <Separator />
                        <div>
                          <p className="font-semibold">Admins & Staff</p>
                          <p className="text-muted-foreground">have full access to system configuration, user management, and sensitive reports.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator />

                {/* section: FAQ */}
                <section id="faq" className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      <IconHelp className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">FAQ</h2>
                      <p className="text-muted-foreground">Common questions and troubleshooting.</p>
                    </div>
                  </div>

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="faq-1">
                      <AccordionTrigger>Why is a student "Blocked"?</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        A student is automatically blocked if they exceed their overdue limit (e.g., have books overdue by 30+ days) or have been manually blocked by a staff member for disciplinary reasons.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="faq-2">
                      <AccordionTrigger>How do I print barcodes?</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        Go to <strong>Reports &gt; Barcodes</strong>. You can select a range of Accession Numbers or specific Students to generate a printable PDF sheet formatted for standard sticky labels.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="faq-3">
                      <AccordionTrigger>Can I import students from Excel?</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        Yes. Go to <strong>Settings &gt; Data Import</strong>. Download the CSV template, fill it with student data (Name, ID, Grade), and upload it. The system will create profiles for new IDs and update existing ones.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </section>

              </div>

              {/* Table of Contents / Sidebar */}
              <div className="hidden lg:block relative">
                <div className="sticky top-8 space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">On this page</h3>
                  <nav className="flex flex-col space-y-2 text-sm">
                    <a href="#workflows" className="block text-foreground/80 hover:text-primary transition-colors">Workflows</a>
                    <a href="#concepts" className="block text-foreground/80 hover:text-primary transition-colors">Core Concepts</a>
                    <a href="#faq" className="block text-foreground/80 hover:text-primary transition-colors">FAQ</a>
                  </nav>

                  <Card className="mt-8 bg-muted/50">
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm">Need Support?</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                      Contact the IT department or system administrator if you encounter technical issues.
                    </CardContent>
                  </Card>
                </div>
              </div>

            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
