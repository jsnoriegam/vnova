/**
 * vnova-engine — TypeScript declarations
 *
 * Covers the full public API:
 *   createEngine · useVNova · useVNovaAudio · useVNovaStore
 *   createQuestEngine · validateScript · expandNestedLabels
 *   VNovaStage · VNovaHud · VNovaTitleScreen
 *   VNovaSettingsModal · VNovaBacklogModal
 *   QS (QUEST_STATUS)
 */

import type { Ref, ComputedRef, CSSProperties, DefineComponent, Plugin, App as VueApp, Component } from 'vue'
import type { Store, Pinia } from 'pinia'

// ─── Primitive aliases ────────────────────────────────────────────────────────

type Milliseconds = number
type CssColor     = string
type Url          = string

export interface CreateVNovaAppOptions {
  props?: Record<string, unknown>
  pinia?: Pinia
  plugins?: Array<Plugin | [Plugin, ...unknown[]]>
}

export declare function createVNovaApp(
  rootComponent: Component,
  options?: CreateVNovaAppOptions,
): VueApp

// ─── Script step types ────────────────────────────────────────────────────────

export type BgTransition = 'fade' | 'dissolve' | 'cut' | 'slide-left' | 'slide-right'
export type SpritePosition = 'left' | 'center' | 'right' | 'left-far' | 'right-far'
export type ImageFit = 'width' | 'height' | 'both' | 'x' | 'y'

export interface LabelStep {
  type: 'label'
  id: string
  /** Nested steps — flattened at runtime. */
  steps?: ScriptStep[]
}

export interface SceneStep {
  type: 'scene'
  id?: string
  src?: Url
  color?: CssColor
  transition?: BgTransition
  /** When true, stops BGM before the scene change. Default: false. */
  stopMusic?: boolean
}

export interface ImageStep {
  type: 'image'
  /** Asset registry key — mutually exclusive with `src`. */
  id?: string
  /** Direct URL — mutually exclusive with `id`. */
  src?: Url | null
  transition?: BgTransition
  fit?: ImageFit
}

export interface ShowStep {
  type: 'show'
  character: string
  position?: SpritePosition
  expression?: string
  variant?: string
  /** Overrides the sprite resolved from the character registry. */
  sprite?: Url
}

export interface HideStep {
  type: 'hide'
  /** Omit to clear the entire stage. */
  character?: string
}

export interface SayStep {
  type: 'say'
  character: string
  text: string
  expression?: string
  variant?: string
  voice?: Url
  /** Auto-advance after typewriter finishes. `true` = immediately, number = delay in ms. */
  advance?: boolean | Milliseconds
  continue?: boolean | Milliseconds
}

export interface ThinkStep {
  type: 'think'
  character: string
  text: string
  expression?: string
  advance?: boolean | Milliseconds
  continue?: boolean | Milliseconds
}

export interface NarrateStep {
  type: 'narrate'
  text: string
  advance?: boolean | Milliseconds
  continue?: boolean | Milliseconds
}

export interface ChoiceOption {
  label: string
  jump?: string
  set?: Record<string, unknown>
  inc?: Record<string, number>
}

export interface ChoiceStep {
  type: 'choice'
  prompt?: string
  options: [ChoiceOption, ChoiceOption, ...ChoiceOption[]]
}

export interface JumpStep {
  type: 'jump'
  target: string
}

export interface BgmStep {
  type: 'bgm'
  /** Asset registry key. */
  id?: string | null
  /** Legacy alias for `id`. */
  track?: string | null
  /** Direct URL — takes precedence over `id`/`track`. */
  src?: Url
  volume?: number
  loop?: boolean
}

export interface SfxStep {
  type: 'sfx'
  id?: string
  track?: string
  src?: Url
  volume?: number
}

export interface VideoStep {
  type: 'video'
  id?: string | null
  track?: string | null
  src?: Url | null
  volume?: number
  loop?: boolean
  muted?: boolean
  stop?: boolean
}

export interface WaitStep {
  type: 'wait'
  ms: Milliseconds
}

export interface NotifyStep {
  type: 'notify'
  status?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  text?: string
}

export interface EndStep {
  type: 'end'
}

export interface CallStep {
  type: 'call'
  fn: (state: VNovaState) => void
}

export type ScriptStep =
  | LabelStep | SceneStep | ImageStep
  | ShowStep  | HideStep
  | SayStep   | ThinkStep | NarrateStep
  | ChoiceStep | JumpStep
  | BgmStep   | SfxStep   | VideoStep | WaitStep | NotifyStep
  | EndStep   | CallStep

// ─── Character registry ───────────────────────────────────────────────────────

export interface CharacterDef {
  name: string
  color?: CssColor
  /** Emoji fallback when no sprite is available. */
  avatar?: string
  defaultSprite?: Url
  /** Keyed by expression/variant name. */
  sprites?: Record<string, Url>
  /** Legacy: keyed by expression name. */
  expressions?: Record<string, Url>
}

export type CharacterRegistry = Record<string, CharacterDef>

// ─── Asset registry ───────────────────────────────────────────────────────────

export interface AssetRegistry {
  scenes?: Record<string, Url>
  music?:  Record<string, Url>
  sounds?: Record<string, Url>
  images?: Record<string, Url>
  videos?: Record<string, Url>
}

// ─── Engine state ─────────────────────────────────────────────────────────────

export interface StageCharacter {
  id: string
  position: SpritePosition
  expression: string
  sprite: Url | null
}

export interface BackgroundState {
  src:        Url | null
  color:      CssColor | null
  transition: BgTransition
}

export interface ImageState {
  src:        Url | null
  transition: BgTransition
  fit:        'width' | 'height' | 'both'
}

export interface EngineSettings {
  typewriterSpeed: Milliseconds
  bgmVolume:       number
  sfxVolume:       number
  textSize:        'small' | 'medium' | 'large'
}

export interface QuestState {
  id:          string
  title:       string
  description: string
  category:    string
  status:      QuestStatusValue
  updatedAt:   number | null
}

/** The raw reactive state object (Pinia store). */
export interface VNovaState {
  cursor:         number
  current:        ScriptStep | null
  stage:          Record<string, StageCharacter>
  background:     BackgroundState
  image:          ImageState
  bgm:            Url | null
  vars:           Record<string, unknown>
  quests:         Record<string, QuestState>
  awaitingChoice: boolean
  ended:          boolean
  history:        ScriptStep[]
  backStack:      StateDiff[][]
  characters:     CharacterRegistry
  settings:       EngineSettings
  // getters
  readonly stageArray:   StageCharacter[]
  readonly speakerName:  string | null
  readonly speakerColor: CssColor | null
  readonly canBack:      boolean
}

interface StateDiff {
  key:    keyof VNovaState
  before: unknown
  after:  unknown
}

// ─── Quests ───────────────────────────────────────────────────────────────────

export type QuestStatusValue = 'inactive' | 'active' | 'completed' | 'failed'

export declare const QS: {
  readonly INACTIVE:  'inactive'
  readonly ACTIVE:    'active'
  readonly COMPLETED: 'completed'
  readonly FAILED:    'failed'
}

export interface QuestDefinition {
  id:             string
  title?:         string
  description?:   string
  category?:      string
  initialStatus?: QuestStatusValue
  failIf?:        (store: QuestContext) => boolean
  doneIf?:        (store: QuestContext) => boolean
  reward?:        (store: QuestContext) => void
  penalty?:       (store: QuestContext) => void
}

export interface QuestContext {
  vars:   Record<string, unknown>
  flags:  Record<string, unknown>
  quests: Record<string, QuestState>
  [key: string]: unknown
}

export interface QuestEngine {
  QS:         typeof QS
  definitions: QuestDefinition[]
  reset():    QuestState[]
  list():     QuestState[]
  get(id: string): QuestState | null
  setStatus(id: string, status: QuestStatusValue): boolean
  evaluate(): boolean
  activate(id: string):   boolean
  complete(id: string):   boolean
  fail(id: string):       boolean
  deactivate(id: string): boolean
}

// ─── Audio event ─────────────────────────────────────────────────────────────

export interface AudioEvent {
  type:   'bgm' | 'sfx'
  track:  Url | null
  volume: number
  loop:   boolean
}

export interface VideoEvent {
  action: 'play' | 'stop'
  track: Url | null
  volume: number
  loop: boolean
  muted: boolean
}

export interface NotifyEvent {
  status?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  text?: string
}

// ─── createEngine options ─────────────────────────────────────────────────────

export interface CreateEngineOptions {
  characters?:       CharacterRegistry
  assets?:           AssetRegistry
  quests?:           QuestDefinition[]
  /** When true, engine is created without applying the first script step until start()/restart(). */
  deferStart?:       boolean
  onAudio?:          (event: AudioEvent) => void
  onVideo?:          (event: VideoEvent) => void
  onNotify?:         (event: NotifyEvent) => void
  onEnd?:            (payload: { reason: string; toTitle: boolean }) => void
  autoAdvanceDelay?: Milliseconds
  /** External Pinia instance. When omitted, a fresh one is created. */
  pinia?:            import('pinia').Pinia
}

// ─── createEngine return ──────────────────────────────────────────────────────

export interface EngineHandle {
  /** Direct access to the Pinia store — use for Vue DevTools / subscriptions. */
  store:          VNovaState
  /** Alias of `store` for backwards compatibility with call steps. */
  state:          VNovaState
  stageArray:     ComputedRef<StageCharacter[]>
  speakerName:    ComputedRef<string | null>
  speakerColor:   ComputedRef<CssColor | null>
  quests:         ComputedRef<Record<string, QuestState>>
  listQuests:     () => QuestState[]
  getQuest:       (id: string) => QuestState | null
  evaluateQuests: () => boolean
  setQuestStatus: (id: string, status: QuestStatusValue) => boolean
  advance():      void
  choose(option: ChoiceOption): void
  back():         boolean
  jump(target: string): void
  start():        void
  restart():      void
  getVar(key: string): unknown
  setVar(key: string, value: unknown): void
  getSetting(key: keyof EngineSettings): unknown
  setSetting(key: keyof EngineSettings, value: unknown): void
  pinia:          import('pinia').Pinia
}

export declare function createEngine(
  script:  ScriptStep[],
  options?: CreateEngineOptions,
): EngineHandle

// ─── BgLayer (useVNova internal, exposed for custom renderers) ────────────────

export interface BgLayer {
  key:        'a' | 'b'
  src:        Url | null
  color:      CssColor | null
  transition: BgTransition
  active:     boolean
  visible:    boolean
  entering:   boolean
}

// ─── useVNova options ─────────────────────────────────────────────────────────

export interface UseVNovaOptions extends CreateEngineOptions {
  typewriterSpeed?:   Milliseconds
  typewriterEnabled?: boolean
  keyboardEnabled?:   boolean
  /** localStorage key for save/load. Required to enable save functionality. */
  saveKey?:           string
}

// ─── useVNova return ──────────────────────────────────────────────────────────

export interface VNovaComposable {
  /** Raw Pinia store (reactive). */
  state:              VNovaState
  store:              VNovaState
  stageArray:         ComputedRef<StageCharacter[]>
  speakerName:        ComputedRef<string | null>
  speakerColor:       ComputedRef<CssColor | null>
  quests:             ComputedRef<Record<string, QuestState>>
  displayedText:      ComputedRef<string>
  textComplete:       Ref<boolean>
  bgLayers:           Ref<BgLayer[]>
  bgLayerStyle:       (layer: BgLayer) => CSSProperties
  imageTransitioning: Ref<boolean>
  imageStyle:         ComputedRef<CSSProperties>
  interact():         void
  choose(option: ChoiceOption): void
  back():             boolean
  jump(target: string): void
  start():            void
  restart():          void
  save():             true | undefined
  load():             boolean
  clearSave():        void
  skipTypewriter():   void
  listQuests():       QuestState[]
  getQuest(id: string): QuestState | null
  evaluateQuests():   boolean
  setQuestStatus(id: string, status: QuestStatusValue): boolean
  getVar(key: string): unknown
  setVar(key: string, value: unknown): void
  getSetting(key: keyof EngineSettings): unknown
  setSetting(key: keyof EngineSettings, value: unknown): void
  /** The underlying engine handle for advanced use. */
  engine:             EngineHandle
}

export declare function useVNova(
  script:   ScriptStep[],
  options?: UseVNovaOptions,
): VNovaComposable

// ─── useVNovaAudio ────────────────────────────────────────────────────────────

export interface UseVNovaAudioOptions {
  bgmVolume?:    number
  sfxVolume?:    number
  fadeDuration?: Milliseconds
}

export interface VNovaAudioHandle {
  /** Pass this to `useVNova` / `VNovaStage` as `options.onAudio`. */
  onAudio:       (event: AudioEvent) => void
  bgmVolume:     Ref<number>
  sfxVolume:     Ref<number>
  setBgmVolume:  (v: number) => void
  setSfxVolume:  (v: number) => void
  stopBgm():     void
  stopAll():     void
}

export declare function useVNovaAudio(
  options?: UseVNovaAudioOptions,
): VNovaAudioHandle

// ─── useVNovaStore (Pinia) ────────────────────────────────────────────────────

export declare function useVNovaStore(): VNovaState

// ─── createQuestEngine ────────────────────────────────────────────────────────

export interface CreateQuestEngineOptions {
  getContext?: () => QuestContext
  getState?:   () => Record<string, QuestState>
  setState?:   (next: Record<string, QuestState>) => void
  now?:        () => number
}

export declare function createQuestEngine(
  definitions?: QuestDefinition[],
  options?:     CreateQuestEngineOptions,
): QuestEngine

// ─── validateScript ───────────────────────────────────────────────────────────

/**
 * Validates a script against a character registry.
 * @throws {Error} on critical structural errors.
 * @returns Array of warning strings (empty = clean).
 */
export declare function validateScript(
  script:      ScriptStep[],
  characters?: CharacterRegistry,
): string[]

// ─── expandNestedLabels ───────────────────────────────────────────────────────

/** Flattens nested label steps into a linear script array. */
export declare function expandNestedLabels(script: ScriptStep[]): ScriptStep[]

// ─── Vue components ───────────────────────────────────────────────────────────

/** Props accepted by VNovaStage. */
export interface VNovaStageProps {
  script:      ScriptStep[]
  characters?: CharacterRegistry
  options?:    UseVNovaOptions
}

/** Events emitted by VNovaStage. */
export interface VNovaStageEmits {
  end:     [payload: { reason: string; toTitle: boolean }]
  choice:  [option: ChoiceOption]
  advance: []
  back:    []
}

export interface VNovaRuntimeContext {
  state: ComputedRef<VNovaState | null>
  canBack: ComputedRef<boolean>
  hasSave: ComputedRef<boolean>
  history: ComputedRef<ScriptStep[]>
  audioLog: Ref<string>
  ui: {
    titleOpen: Ref<boolean>
    settingsOpen: Ref<boolean>
    backlogOpen: Ref<boolean>
    saveOpen: Ref<boolean>
    saveMode: Ref<'save' | 'load'>
  }
  actions: {
    newGame(): void
    loadGame(): void
    back(): void
    restart(): void
    exitMenu(): void
    openSave(): void
    openLoad(): void
    openBacklog(): void
    openSettings(): void
    closeAllModals(): void
    setSetting(key: keyof EngineSettings, value: unknown): void
  }
  registerStageApi(api: Partial<VNovaStageExposed> | null): void
}

export interface VNovaRuntimeResolverInput {
  componentName: string
  vnode: unknown
  runtime: VNovaRuntimeContext
  stage: VNovaStageExposed | null
  config: Record<string, unknown>
}

export interface VNovaRuntimeResolverResult {
  props?: Record<string, unknown>
  listeners?: Record<string, (...args: unknown[]) => void>
}

export interface VNovaRuntimeProps {
  script: ScriptStep[]
  characters?: CharacterRegistry
  assets?: AssetRegistry
  config?: Record<string, unknown>
  componentResolvers?: Record<string, (input: VNovaRuntimeResolverInput) => VNovaRuntimeResolverResult | null | undefined>
}

/** Methods/state exposed via `ref` on VNovaStage. */
export interface VNovaStageExposed {
  interact():   void
  choose(option: ChoiceOption): void
  back():       boolean
  jump(target: string): void
  restart():    void
  save():       true | undefined
  load():       boolean
  clearSave():  void
  openSave():   void
  openLoad():   void
  closeSave():  void
  saveOpen:     Ref<boolean>
  saveMode:     Ref<'save' | 'load'>
  exitMenu():   void
  canBack:      ComputedRef<boolean>
  hasSave:      Ref<boolean>
  history:      ComputedRef<ScriptStep[]>
  listQuests(): QuestState[]
  getQuest(id: string): QuestState | null
  evaluateQuests(): boolean
  setQuestStatus(id: string, status: QuestStatusValue): boolean
  getVar(key: string): unknown
  setVar(key: string, value: unknown): void
  getSetting(key: keyof EngineSettings): unknown
  setSetting(key: keyof EngineSettings, value: unknown): void
  state: VNovaState
}

// ─── useVNovaSaves ────────────────────────────────────────────────────────────

export interface SlotMeta {
  slot:          number
  label:         string
  savedAt:       number | null
  formattedDate: string | null
  thumbnail:     string | null   // base64 data URL
  bgColor:       CssColor | null
  bgSrc:         Url | null
}

export interface UseVNovaSavesOptions {
  saveKey?:   string
  slotCount?: number
  stageRef?:  Ref<HTMLElement | null>
  store?:     unknown
}

export interface VNovaSavesHandle {
  slots:        Ref<(SlotMeta | null)[]>
  saving:       Ref<boolean>
  lastFileError: Ref<{ code: string; message: string } | null>
  saveSlot:     (slot: number) => Promise<boolean>
  loadSlot:     (slot: number) => boolean
  deleteSlot:   (slot: number) => void
  clearAll:     () => void
  exportSaves:  () => Promise<boolean>
  importSaves:  () => Promise<boolean>
  saveToDisk:   () => Promise<boolean>
  loadFromDisk: () => Promise<boolean>
  refresh:      () => void
}

export declare function useVNovaSaves(options?: UseVNovaSavesOptions): VNovaSavesHandle

// ─── VNovaSaveModal ───────────────────────────────────────────────────────────

export interface VNovaSaveModalProps {
  saveKey?:   string
  slotCount?: number
  stageRef?:  Ref<HTMLElement | null>
  store?:     unknown
  mode?:      'save' | 'load'
  open?:      boolean
}

export interface VNovaSaveModalEmits {
  close:   []
  saved:   [slot: number]
  loaded:  [slot: number]
  deleted: [slot: number]
}

export declare const VNovaSaveModal: DefineComponent<VNovaSaveModalProps, Record<string, never>, VNovaSaveModalEmits>

export declare const VNOVA_RUNTIME_CONTEXT_KEY: 'vnova-runtime'
export declare const VNovaRuntime: DefineComponent<VNovaRuntimeProps>
export declare const VNovaStage:      DefineComponent<VNovaStageProps, VNovaStageExposed, VNovaStageEmits>
export declare const VNovaTitleScreen: DefineComponent<Record<string, never>>
export declare const VNovaHud: DefineComponent<
  { canBack?: boolean; audioLog?: string; visible?: boolean; showBacklog?: boolean },
  Record<string, never>,
  { back: []; 'open-save': []; 'open-load': []; 'open-backlog': []; 'open-settings': []; restart: []; 'exit-menu': [] }
>
export declare const VNovaSettingsModal: DefineComponent<Record<string, never>>
export declare const VNovaBacklogModal:  DefineComponent<{ history?: ScriptStep[] }>
