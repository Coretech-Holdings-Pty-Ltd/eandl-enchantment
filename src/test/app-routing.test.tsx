import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { companyContact, learningHub } from "@/lib/site-content";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("matches a page for /learning-hub", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/learning-hub");

    expect(matches.at(-1)?.routeId).toBe("/learning-hub");
  });

  it("ensures updated contact numbers and removes deprecated phone", () => {
    expect(companyContact.landline).toBe("010 057 2860");
    expect(companyContact.whatsapp).toBe("083 432 5339");
    expect(JSON.stringify(companyContact)).not.toContain("0790284802");
    expect(JSON.stringify(companyContact)).not.toContain("079 028 4802");
  });

  it("provides complete learning hub curriculum and free course data", () => {
    expect(learningHub.title).toContain("Learning Hub");
    expect(learningHub.slogan).toBe("From Africa, For Africa. Don't just consume AI, create it.");
    expect(learningHub.levels).toHaveLength(3);
    expect(learningHub.freeCourse.lessons).toHaveLength(4);
    expect(learningHub.freeCourse.quiz).toHaveLength(4);
  });
});
