import { describe, it, expect } from "vitest";
import { execFile } from "child_process";
import { promisify } from "util";
import { resolve } from "path";

const execFileAsync = promisify(execFile);

const PROFILE = resolve(import.meta.dirname, "fixtures/test-profile-1.json.gz");
const CLI = resolve(import.meta.dirname, "../dist/index.js");

async function runCli(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync("node", [CLI, ...args], { timeout: 120_000 });
}

describe("--flamegraph", () => {
  describe("test-profile-1", () => {
    it("returns flamegraph tree limited to depth 3", async () => {
      const { stdout } = await runCli([PROFILE, "--flamegraph", "3"]);

      expect(stdout).toContain("Flamegraph (max depth: 3):");
      expect(stdout).toContain("start (100.0%, 22215 samples)");
      expect(stdout).toContain("└─ main (100.0%, 22215 samples)");
      expect(stdout).toContain("   └─ XRE_InitChildProcess(int, char**, XREChildData const*) (100.0%, 22215 samples)");
    }, 120_000);

    it("returns flamegraph tree limited to depth 5", async () => {
      const { stdout } = await runCli([PROFILE, "--flamegraph", "5"]);

      expect(stdout).toContain("Flamegraph (max depth: 5):");
      expect(stdout).toContain("start (100.0%, 22215 samples)");
      expect(stdout).toContain("└─ main (100.0%, 22215 samples)");
      expect(stdout).toContain("   └─ XRE_InitChildProcess(int, char**, XREChildData const*) (100.0%, 22215 samples)");
      expect(stdout).toContain("      ├─ MessageLoop::Run() (99.8%, 22168 samples)");
      expect(stdout).toContain("      │  └─ XRE_RunAppShell() (99.8%, 22168 samples)");
      expect(stdout).toContain("      ├─ mozilla::dom::ContentProcess::Init(int, char**) (0.2%, 45 samples)");
      expect(stdout).toContain("      │  └─ mozilla::dom::ContentProcess::InfallibleInit(int, char**) (0.2%, 45 samples)");
      expect(stdout).toContain("      ├─ MachChildProcessCheckIn(char const*, unsigned int, std::__1::vector<std::__1::unique_ptr<unsigned int, mozilla::detail::MachSendRightDeleter>, std::__1::allocator<std::__1::unique_ptr<unsigned int, mozilla::detail::MachSendRightDeleter> > >&, std::__1::vector<std::__1::unique_ptr<unsigned int, mozilla::detail::MachReceiveRightDeleter>, std::__1::allocator<std::__1::unique_ptr<unsigned int, mozilla::detail::MachReceiveRightDeleter> > >&) (0.0%, 1 samples)");
      expect(stdout).toContain("      │  └─ bootstrap_look_up (0.0%, 1 samples)");
      expect(stdout).toContain("      └─ mozilla::IOInterposer::Init() (0.0%, 1 samples)");
      expect(stdout).toContain("         └─ dyld4::APIs::dlsym(void*, char const*) (0.0%, 1 samples)");
    }, 120_000);

    it("returns flamegraph tree limited to depth 8", async () => {
      const { stdout } = await runCli([PROFILE, "--flamegraph", "8"]);

      expect(stdout).toContain("Flamegraph (max depth: 8):");
      expect(stdout).toContain("      │  └─ XRE_RunAppShell() (99.8%, 22168 samples)");
      expect(stdout).toContain("      │     ├─ nsAppShell::Run() (99.7%, 22158 samples)");
      expect(stdout).toContain("      │     │  └─ nsBaseAppShell::Run() (99.7%, 22158 samples)");
      expect(stdout).toContain("      │     │     └─ MessageLoop::Run() (99.7%, 22158 samples)");
      expect(stdout).toContain("      │     └─ nsGetServiceByCID::operator()(nsID const&, void**) const (0.0%, 10 samples)");
      expect(stdout).toContain("      ├─ mozilla::dom::ContentProcess::Init(int, char**) (0.2%, 45 samples)");
      expect(stdout).toContain("      │     ├─ mozilla::dom::ContentChild::Init(mozilla::ipc::UntypedEndpoint&&, char const*, bool) (0.2%, 37 samples)");
      expect(stdout).toContain("      │     ├─ NS_InitXPCOM (0.0%, 6 samples)");
      expect(stdout).toContain("      │     └─ bootstrap_look_up3 (0.0%, 1 samples)");
      expect(stdout).toContain("               └─ dyld4::Loader::hasExportedSymbol(Diagnostics&, dyld4::RuntimeState&, char const*, dyld4::Loader::ExportedSymbolMode, dyld4::Loader::ResolverMode, dyld4::Loader::ResolvedSymbol*, dyld3::Array<dyld4::Loader const*>*) const (0.0%, 1 samples)");
    }, 120_000);
  });
});

describe("--top-markers", () => {
  describe("test-profile-1", () => {
    it("returns top markers by duration and max instance", async () => {
      const { stdout } = await runCli([PROFILE, "--top-markers"]);

      expect(stdout).toContain("Total unique markers: 110");

      expect(stdout).toContain("Top 5 markers by total duration:");
      expect(stdout).toContain("1. suite-NewsSite-Nuxt-prepare - 5209.82 ms total (count: 100, avg: 52.10 ms)");
      expect(stdout).toContain("2. suite-NewsSite-Nuxt - 5196.01 ms total (count: 100, avg: 51.96 ms)");
      expect(stdout).toContain("3. NewsSite-Nuxt.NavigateToUS-async - 1115.18 ms total (count: 100, avg: 11.15 ms)");
      expect(stdout).toContain("4. NewsSite-Nuxt.NavigateToWorld-async - 927.80 ms total (count: 100, avg: 9.28 ms)");
      expect(stdout).toContain("5. NewsSite-Nuxt.NavigateToPolitics-async - 901.67 ms total (count: 100, avg: 9.02 ms)");

      expect(stdout).toContain("Top 5 markers by max single instance duration:");
      expect(stdout).toContain("1. iteration-0 - 148.45 ms max (total: 148.45 ms, count: 1)");
      expect(stdout).toContain("2. iteration-10 - 144.56 ms max (total: 144.56 ms, count: 1)");
      expect(stdout).toContain("3. iteration-64 - 144.09 ms max (total: 144.09 ms, count: 1)");
      expect(stdout).toContain("4. iteration-25 - 143.30 ms max (total: 143.30 ms, count: 1)");
      expect(stdout).toContain("5. iteration-67 - 131.40 ms max (total: 131.40 ms, count: 1)");
    }, 120_000);
  });
});

describe("--calltree", () => {
  describe("test-profile-1", () => {
    it("returns top 10 functions filtered by focus-marker", async () => {
      const { stdout } = await runCli([PROFILE, "--calltree", "10", "--focus-marker=-async,-sync"]);

      expect(stdout).toContain("Collected 1318 total nodes");
      expect(stdout).toContain('Top 10 functions by self time (marker: "-async,-sync"):');
      expect(stdout).toContain("1. free - 112 samples (112 total)");
      expect(stdout).toContain("2. mozilla::ReflowInput::ReflowInput(nsPresContext*, mozilla::ReflowInput const&, nsIFrame*, mozilla::LogicalSize const&, mozilla::Maybe<mozilla::LogicalSize> const&, mozilla::EnumSet<mozilla::ReflowInput::InitFlag, unsigned char>, mozilla::StyleSizeOverrides const&, mozilla::EnumSet<mozilla::ComputeSizeFlag, unsigned char>, mozilla::AnchorPosResolutionCache*) - 100 samples (100 total)");
      expect(stdout).toContain("3. malloc - 81 samples (81 total)");
      expect(stdout).toContain("4. style::properties::cascade::cascade_rules - 81 samples (81 total)");
      expect(stdout).toContain("5. _platform_memset - 74 samples (74 total)");
      expect(stdout).toContain("6. nsFlexContainerFrame::DoFlexLayout(mozilla::ReflowInput const&, int, int, nsFlexContainerFrame::FlexboxAxisTracker const&, int, int, nsTArray<nsFlexContainerFrame::StrutInfo>&, ComputedFlexContainerInfo*) - 61 samples (61 total)");
      expect(stdout).toContain("7. BaselineIC: Call.CallScripted - 49 samples (49 total)");
      expect(stdout).toContain("8. style::properties::generated::StyleBuilder::build - 47 samples (47 total)");
      expect(stdout).toContain("9. servo_arc::Arc<T>::drop_slow - 47 samples (47 total)");
      expect(stdout).toContain("10. _platform_memmove - 44 samples (44 total)");
    }, 120_000);

    it("returns top 5 functions filtered by callers-of", async () => {
      const { stdout } = await runCli([PROFILE, "--calltree", "5", "--callers-of", "style::properties::cascade::cascade_rules"]);

      expect(stdout).toContain("Collected 130 total nodes");
      expect(stdout).toContain('Top 5 functions by self time (callers-of: "style::properties::cascade::cascade_rules"):');
      expect(stdout).toContain("1. style::properties::cascade::cascade_rules - 105 samples (105 total)");
      expect(stdout).toContain("2. style::properties::generated::StyleBuilder::build - 59 samples (59 total)");
      expect(stdout).toContain("3. style::properties::cascade::Cascade::apply_non_prioritary_properties - 58 samples (58 total)");
      expect(stdout).toContain("4. malloc - 31 samples (31 total)");
      expect(stdout).toContain("5. cssparser::parser::Parser::next - 19 samples (19 total)");
    }, 120_000);

    it("matches callers-of with generic type parameters stripped", async () => {
      const { stdout } = await runCli([PROFILE, "--calltree", "5", "--focus-marker=-async,-sync", "--callers-of", "servo_arc::Arc::drop_slow"]);

      expect(stdout).toContain("Collected 15 total nodes");
      expect(stdout).toContain('Top 5 functions by self time (callers-of: "servo_arc::Arc::drop_slow", marker: "-async,-sync"):');
      expect(stdout).toContain("1. servo_arc::Arc<T>::drop_slow - 47 samples (47 total)");
      expect(stdout).toContain("2. free - 33 samples (33 total)");
      expect(stdout).toContain("3. _platform_memset - 15 samples (15 total)");
      expect(stdout).toContain("4. nsStylePosition::~nsStylePosition() - 9 samples (9 total)");
      expect(stdout).toContain("5. os_unfair_lock_unlock - 5 samples (5 total)");
    }, 120_000);

    it("collapses function subtree and matches by stripped generics", async () => {
      const { stdout } = await runCli([PROFILE, "--calltree", "5", "--focus-marker=-async,-sync", "--collapse-function", "servo_arc::Arc::drop_slow"]);

      expect(stdout).toContain("Collected 1311 total nodes");
      expect(stdout).toContain('Top 5 functions by self time (collapse: "servo_arc::Arc::drop_slow", marker: "-async,-sync"):');
      expect(stdout).toContain("1. servo_arc::Arc<T>::drop_slow - 127 samples (127 total)");
      expect(stdout).toContain("2. mozilla::ReflowInput::ReflowInput(nsPresContext*, mozilla::ReflowInput const&, nsIFrame*, mozilla::LogicalSize const&, mozilla::Maybe<mozilla::LogicalSize> const&, mozilla::EnumSet<mozilla::ReflowInput::InitFlag, unsigned char>, mozilla::StyleSizeOverrides const&, mozilla::EnumSet<mozilla::ComputeSizeFlag, unsigned char>, mozilla::AnchorPosResolutionCache*) - 100 samples (100 total)");
      expect(stdout).toContain("3. malloc - 81 samples (81 total)");
      expect(stdout).toContain("4. style::properties::cascade::cascade_rules - 81 samples (81 total)");
      expect(stdout).toContain("5. free - 79 samples (79 total)");
    }, 120_000);

    it("focus-function collapses subtree and focuses on single node", async () => {
      const { stdout } = await runCli([PROFILE, "--calltree", "5", "--focus-marker=-async,-sync", "--focus-function", "servo_arc::Arc::drop_slow"]);

      expect(stdout).toContain("Collected 1 total nodes");
      expect(stdout).toContain('Top 5 functions by self time (focus: "servo_arc::Arc::drop_slow", marker: "-async,-sync"):');
      expect(stdout).toContain("1. servo_arc::Arc<T>::drop_slow - 127 samples (127 total)");

      const lines = stdout.split("\n").filter((l: string) => /^\d+\./.test(l.trim()));
      expect(lines).toHaveLength(1);
    }, 120_000);

    it("focus-function --detailed shows full caller chains", async () => {
      const { stdout } = await runCli([PROFILE, "--calltree", "5", "--focus-marker=-async,-sync", "--focus-function", "servo_arc::Arc::drop_slow", "--detailed"]);

      expect(stdout).toContain("Collected 1 total nodes");
      expect(stdout).toContain('Top 5 functions by self time (focus: "servo_arc::Arc::drop_slow", marker: "-async,-sync"):');
      expect(stdout).toContain("1. servo_arc::Arc<T>::drop_slow - 127 samples (127 total)");
      expect(stdout).toContain("Call path #1 - 14 samples (11.0% of this function):");
      expect(stdout).toContain("   servo_arc::Arc<T>::drop_slow");
      expect(stdout).toContain("   style::style_resolver::StyleResolverForElement<E>::resolve_style");
      expect(stdout).toContain("   style::parallel::style_trees");
      expect(stdout).toContain("   geckoservo::glue::traverse_subtree");
      expect(stdout).toContain("   start");
    }, 120_000);

    it("returns top 10 functions by self time", async () => {
      const { stdout } = await runCli([PROFILE, "--calltree", "10"]);

      expect(stdout).toContain("Top 10 functions by self time:");
      expect(stdout).toContain("Collected 2197 total nodes");

      const lines = [
        "1. __psynch_cvwait - 12641 samples (12641 total)",
        "2. free - 195 samples (195 total)",
        "3. _platform_memmove - 186 samples (186 total)",
        "4. _platform_memset - 176 samples (176 total)",
        "5. js::gc::TenuringTracer::collectToObjectFixedPoint() - 132 samples (132 total)",
        "6. mozilla::ReflowInput::ReflowInput(nsPresContext*, mozilla::ReflowInput const&, nsIFrame*, mozilla::LogicalSize const&, mozilla::Maybe<mozilla::LogicalSize> const&, mozilla::EnumSet<mozilla::ReflowInput::InitFlag, unsigned char>, mozilla::StyleSizeOverrides const&, mozilla::EnumSet<mozilla::ComputeSizeFlag, unsigned char>, mozilla::AnchorPosResolutionCache*) - 123 samples (123 total)",
        "7. malloc - 112 samples (112 total)",
        "8. style::properties::cascade::cascade_rules - 105 samples (105 total)",
        "9. js::gc::AllocateTenuredCellInGC(JS::Zone*, js::gc::AllocKind) - 99 samples (99 total)",
        "10. BaselineIC: Call.CallScripted - 95 samples (95 total)",
      ];

      for (const line of lines) {
        expect(stdout).toContain(line);
      }
    }, 120_000);
  });
});
