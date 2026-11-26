/**
 * vnova-engine — TypeScript declarations
 *
 * Covers the full public API:
 *   createEngine · useVNovaEngine · useEngine · useUserStorage · useVNovaAudio · useVNovaStore
 *   createQuestEngine · validateScript · expandNestedLabels
 *   VNovaStage · VNovaHud · VNovaTitleScreen
 *   VNovaTopHud
 *   VNovaSettingsModal · VNovaBacklogModal
 *   QS (QUEST_STATUS)
 */
import type { Ref, ComputedRef, WritableComputedRef, CSSProperties, DefineComponent, Plugin, App as VueApp, Component } from 'vue'
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
export declare function registerRuntimeModal(
  config: VNovaRuntimeConfig | null | undefined,
  id: string,
  component: Component,
): VNovaRuntimeConfig
export declare function registerRuntimeModals(
  config: VNovaRuntimeConfig | null | undefined,
  modalMap: Record<string, Component>,
): VNovaRuntimeConfig
// ─── Script step types ────────────────────────────────────────────────────────
export type BgTransition = 'fade' | 'dissolve' | 'cut' | 'slide-left' | 'slide-right'
export type SpritePosition = 'left' | 'center' | 'right' | 'left-far' | 'right-far'
export type ImageFit = 'width' | 'height' | 'both' | 'x' | 'y'
export type ModalSize = 'small' | 'medium' | 'large' | 'xlarge' | 'fullscreen' | 'sm' | 'md' | 'lg' | 'xl' | 'full'

export type ConditionOperator =
  | 'eq' | 'neq' | 'ne'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'in' | 'notIn' | 'nin'
  | 'contains' | 'matches'
  | 'exists' | 'truthy' | 'falsy'

/**
 * Declarative condition used by `if`, conditional `jump`, `choice.condition`
 * and `choice.disabled`.
 *
 * Every operator can also be written as a var/operator/value object:
 * `{ var: 'stats.courage', gte: 3 }`. Shorthand maps such as
 * `{ 'flags.metHana': true }` are combined with AND.
 */
export type Condition =
  | boolean
  | ((ctx: QuestContext) => boolean)
  | Condition[]
  | ({
      var?: string
      path?: string
      all?: Condition[]
      any?: Condition[]
      not?: Condition
      eq?: unknown
      neq?: unknown
      ne?: unknown
      gt?: number
      gte?: number
      lt?: number
      lte?: number
      in?: unknown[]
      notIn?: unknown[]
      nin?: unknown[]
      contains?: unknown
      matches?: string
      exists?: boolean
      truthy?: boolean
      falsy?: boolean
      /** Inventory checks. */
      hasItem?: string | string[]
      item?: string
      hasType?: string | string[]
      typeCount?: string
    } & Record<string, unknown>)

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
  /**
   * @deprecated Use `{ type: 'hide', image: true }` instead.
   * Clears the active image layer.
   */
  hide?: boolean
  /** Asset registry key — mutually exclusive with `src`. */
  id?: string
  /** Direct URL — mutually exclusive with `id`. */
  src?: Url | null
  transition?: BgTransition
  fit?: ImageFit
}
export interface CallStepContextEngine {
  state: VNovaState
  store: VNovaState
  advance: () => void
  choose: (option: ChoiceOption) => void
  submitInput: (value: string) => boolean
  submitSelect: (option: unknown) => boolean
  closeModal: () => void
  back: () => boolean
  jump: (target: string) => void
  restart: () => void
  start: () => void
  exitMenu: () => void
  getVar: (key: string) => unknown
  setVar: (key: string, value: unknown) => void
  getSetting: (key: string) => unknown
  setSetting: (key: string, value: unknown) => void
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
  /** Hide a specific character (string) or all characters (true). */
  character?: string | true
  /** Clear the image layer. */
  image?: string | true
  /** Stop/clear the video layer. */
  video?: string | true
  /** Stop/clear the particles layer. */
  particles?: string | true
  /** Transition for image/video hide. */
  transition?: BgTransition
  /** Fit for image hide. */
  fit?: ImageFit
}
export interface SayStep {
  type: 'say'
  /** Optional stable id used by read/skip tracking. */
  id?: string
  character: string
  text: string
  expression?: string
  variant?: string
  /** Voice asset id (from `assets.voices`) or direct URL. */
  voice?: Url
  /** Per-line voice volume multiplier. Default: 1. */
  voiceVolume?: number
  /** Auto-advance after typewriter finishes. `true` = immediately, number = delay in ms. */
  advance?: boolean | Milliseconds
  continue?: boolean | Milliseconds
}
export interface ThinkStep {
  type: 'think'
  id?: string
  character: string
  text: string
  expression?: string
  voice?: Url
  voiceVolume?: number
  advance?: boolean | Milliseconds
  continue?: boolean | Milliseconds
}
export interface NarrateStep {
  type: 'narrate'
  id?: string
  text: string
  voice?: Url
  voiceVolume?: number
  advance?: boolean | Milliseconds
  continue?: boolean | Milliseconds
}
export interface ChoiceOption {
  label: string
  jump?: string
  set?: Record<string, unknown>
  inc?: Record<string, number>
  condition?: Condition
  disabled?: Condition
  disabledText?: string
  [key: string]: unknown
}
export interface ChoiceStep {
  type: 'choice'
  prompt?: string
  /** Enable background blur behind the choice panel. Default: false. */
  blur?: boolean
  options: [ChoiceOption, ChoiceOption, ...ChoiceOption[]]
}
export interface ModalStep {
  type: 'modal'
  id: string
  /** Optional UI registry key. Defaults to `id` when omitted. */
  ui?: string
  title?: string
  size?: ModalSize
  prompt?: string
  options?: [ChoiceOption, ...ChoiceOption[]]
}
export interface InputStep {
  type: 'input'
  store: string
  prompt?: string
  placeholder?: string
  default?: string
  required?: boolean
  maxLength?: number
  inputType?: string
  submitLabel?: string
  /** Enable background blur behind the input panel. Default: false. */
  blur?: boolean
  set?: Record<string, unknown>
  inc?: Record<string, number>
  jump?: string
}
export type SelectOption = string | (ChoiceOption & { value?: unknown })
export interface SelectStep {
  type: 'select'
  store: string
  prompt?: string
  /** Enable background blur behind the select panel. Default: false. */
  blur?: boolean
  options: [SelectOption, ...SelectOption[]]
  set?: Record<string, unknown>
  inc?: Record<string, number>
  jump?: string
}
export interface JumpStep {
  type: 'jump'
  target: string
  /** Jump only when this condition is true. */
  if?: Condition
  condition?: Condition
  when?: Condition
}
export interface SetStep {
  type: 'set'
  /** Variables to assign. Supports dot paths. */
  vars?: Record<string, unknown>
  /** Numeric increments. Supports dot paths. */
  inc?: Record<string, number>
  /** Dot paths to delete. */
  unset?: string[]
}
export interface IfStep {
  type: 'if'
  condition: Condition
  /** Steps executed when the condition is true. */
  then?: ScriptStep[]
  /** Alias of `then`. */
  steps?: ScriptStep[]
  /** Steps executed when the condition is false. */
  else?: ScriptStep[]
}
export interface OnceStep {
  type: 'once'
  /** Unique id, scoped to the current save. */
  id: string
  steps?: ScriptStep[]
  /** Alias of `steps`. */
  then?: ScriptStep[]
}
export interface RandomOption {
  /** Relative probability. Default: 1. */
  weight?: number
  steps?: ScriptStep[]
  /** Alias of `steps`. */
  then?: ScriptStep[]
}
export interface RandomStep {
  type: 'random'
  options: [RandomOption, ...RandomOption[]]
}
export type ProgressKind = 'cg' | 'ending' | 'achievement' | 'chapter'
export interface UnlockTarget {
  kind: ProgressKind
  id: string
}
export interface UnlockStep {
  type: 'unlock'
  cg?: string | string[]
  cgs?: string | string[]
  ending?: string | string[]
  endings?: string | string[]
  achievement?: string | string[]
  achievements?: string | string[]
  chapter?: string | string[]
  chapters?: string | string[]
  /** Generic form: `{ kind: 'cg', id: 'cg-01' }`. */
  kind?: ProgressKind
  id?: string
  /** Multiple targets in one step. */
  targets?: UnlockTarget[]
}
export type ItemAction = 'give' | 'add' | 'take' | 'remove' | 'use' | 'set' | 'clear'
export interface ItemStep {
  type: 'item'
  action?: ItemAction
  id?: string
  item?: string
  qty?: number
  quantity?: number
  data?: Record<string, unknown>
  /** Shorthand forms. */
  give?: string
  take?: string
  use?: string
  clear?: boolean | string
}
export interface BgmStep {
  type: 'bgm'
  /**
   * @deprecated Use `{ type: 'stop', bgm: true }` instead.
   */
  stop?: boolean
  /** Asset registry key. */
  id?: string | null
  /** Direct URL — takes precedence over `id`. */
  src?: Url
  volume?: number
  loop?: boolean
}
export interface SfxStep {
  type: 'sfx'
  id?: string
  src?: Url
  volume?: number
}
export interface VideoStep {
  type: 'video'
  id?: string | null
  src?: Url | null
  volume?: number
  loop?: boolean
  muted?: boolean
  controls?: boolean | 'displayable'
  /**
   * @deprecated Use `{ type: 'hide', video: true }` or `{ type: 'stop', video: true }` instead.
   */
  stop?: boolean
}
export interface ParticlesStep {
  type: 'particles'
  id?: string | null
  /**
   * @deprecated Use `{ type: 'hide', particles: true }` or `{ type: 'stop', particles: true }` instead.
   */
  stop?: boolean
  config?: Record<string, unknown>
}
export interface StopStep {
  type: 'stop'
  /** Stop background music. */
  bgm?: true
  /** Stop video playback. */
  video?: true
  /** Stop particle effects. */
  particles?: true
}
export interface EffectStep {
  type: 'effect'
  /** Effect name (e.g., 'shake', 'flash', 'zoom', 'pulse'). */
  name: string
  /** Target element: 'stage', 'bg', 'image', or character id. */
  target?: 'stage' | 'bg' | 'image' | string
  /** Duration in milliseconds. */
  duration?: Milliseconds
  /** If true, blocks script advancement until effect completes. */
  wait?: boolean
  /** Effect-specific configuration parameters. */
  config?: {
    /** For shake: intensity in px (default: 8). */
    intensity?: number
    /** For shake: 'horizontal' | 'vertical' | 'both' (default: 'horizontal'). */
    direction?: string
    /** For flash: background color (default: 'rgba(255, 255, 255, 0.8)'). */
    color?: string
    /** For zoom: scale factor (default: 1.2). */
    scale?: number
    /** For zoom: 'in' | 'out' (default: 'in'). */
    zoomDirection?: string
    /** For pulse: number of cycles (default: 2). */
    cycles?: number
    /** For pulse: minimum opacity (default: 0.5). */
    opacity?: number
  }
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
  fn: (
    state?: VNovaState,
    context?: {
      jump: (target: string) => void
      moveTo: (index: number) => void
      engine: CallStepContextEngine
      quest: {
        activate: (id: string) => boolean
        complete: (id: string) => boolean
        fail: (id: string) => boolean
        deactivate: (id: string) => boolean
        setStatus: (id: string, status: QuestStatusValue) => boolean
      }
    }
  ) => void | string | { jump?: string; moveTo?: number; stay?: boolean }
}
export type ScriptStep =
  | LabelStep | SceneStep | ImageStep
  | ShowStep  | HideStep
  | SayStep   | ThinkStep | NarrateStep
  | ChoiceStep | ModalStep | InputStep | SelectStep | JumpStep
  | SetStep    | IfStep    | OnceStep   | RandomStep
  | BgmStep   | SfxStep   | VideoStep | ParticlesStep | StopStep | EffectStep | WaitStep | NotifyStep
  | UnlockStep
  | ItemStep
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
  voices?: Record<string, Url>
  images?: Record<string, Url>
  videos?: Record<string, Url>
}
export interface CreditLine {
  text?: string
  html?: string
}
export interface CreditSection {
  label: string
  lines: CreditLine[]
}
export type CreditsRegistry = CreditSection[]
export type ParticlePreset = Record<string, unknown>
export type ParticleRegistry = Record<string, ParticlePreset>
export declare const PARTICLE_PRESETS: ParticleRegistry
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
  voiceVolume:     number
  textSize:        'small' | 'medium' | 'large'
  spacebarFastForward: 'fullspeed' | 'throttled' | 'off'
  theme:           string
}
export type SpacebarFastForwardSetting = 'fullspeed' | 'throttled' | 'off'
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
  lastLabel:      string | null
  stage:          Record<string, StageCharacter>
  background:     BackgroundState
  image:          ImageState
  video:          VideoEvent | null
  bgm:            Url | null
  particles:      { action: 'play' | 'stop'; id: string | null; config: ParticlePreset | null } | null
  vars:           Record<string, unknown>
  quests:         Record<string, QuestState>
  awaitingChoice: boolean
  ended:          boolean
  history:        ScriptStep[]
  backStack:      StateDiff[][]
  characters:     CharacterRegistry
  credits:        CreditsRegistry
  settings:       EngineSettings
  // getters
  readonly stageArray:   StageCharacter[]
  readonly speakerName:  string | null
  readonly speakerColor: CssColor | null
  readonly canBack:      boolean
}
export interface UserStorageHandle {
  /** Reactive user-defined variables saved in VNova state. */
  vars:   ComputedRef<Record<string, unknown>>
  /** Reads a variable by key or dotted path, e.g. `player.name`. */
  get<T = unknown>(path: string, fallback?: T): T
  has(path: string): boolean
  /** Writes a variable by key or dotted path. Returns false for invalid paths. */
  set(path: string, value: unknown): boolean
  update(path: string, updater: (value: unknown) => unknown, fallback?: unknown): boolean
  inc(path: string, amount?: number): boolean
  toggle(path: string): boolean
  remove(path: string): boolean
  clear(): boolean
  /** Writable computed ref for templates and v-model. */
  ref<T = unknown>(path: string, fallback?: T): WritableComputedRef<T>
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
  failIf?:        () => boolean
  doneIf?:        () => boolean
  reward?:        () => void
  penalty?:       () => void
  onComplete?:    QuestTransitionRule
  onFail?:        QuestTransitionRule
}
export interface QuestTransitionRule {
  activate?: string[] | string
  complete?: string[] | string
  fail?: string[] | string
  deactivate?: string[] | string
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
  activate(id: string):   boolean
  complete(id: string):   boolean
  fail(id: string):       boolean
  deactivate(id: string): boolean
  all:           ComputedRef<Record<string, QuestState>>
  active:        ComputedRef<QuestState[]>
  completed:     ComputedRef<QuestState[]>
  failed:        ComputedRef<QuestState[]>
  status(id: string): QuestStatusValue
  is(id: string, expectedStatus: QuestStatusValue): boolean
}
// ─── Audio event ─────────────────────────────────────────────────────────────
export interface AudioEvent {
  type:   'bgm' | 'sfx' | 'voice'
  track:  Url | null
  volume: number
  loop:   boolean
  character?: string | null
}
export interface VideoEvent {
  action: 'play' | 'stop'
  track: Url | null
  volume: number
  loop: boolean
  muted: boolean
  controls?: boolean
}
export interface ParticlesEvent {
  action: 'play' | 'stop'
  id: string | null
  config: ParticlePreset | null
}
export interface NotifyEvent {
  status?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  text?: string
}
export interface EffectEvent {
  name: string
  target?: string
  duration?: Milliseconds
  config?: Record<string, unknown>
}
// ─── createEngine options ─────────────────────────────────────────────────────
export interface CreateEngineOptions {
  characters?:       CharacterRegistry
  assets?:           AssetRegistry
  credits?:          CreditsRegistry
  particles?:        ParticleRegistry
  quests?:           QuestDefinition[]
  items?:            Record<string, ItemDefinition> | ItemDefinition[]
  itemTypes?:        Record<string, ItemTypeDefinition> | ItemTypeDefinition[]
  initialState?: {
    vars?: Record<string, unknown>
    quests?: Record<string, unknown>
  }
  /** When true, engine is created without applying the first script step until start()/restart(). */
  deferStart?:       boolean
  onAudio?:          (event: AudioEvent) => void
  onParticles?:      (event: ParticlesEvent) => void
  onVideo?:          (event: VideoEvent) => void
  onNotify?:         (event: NotifyEvent) => void
  onEffect?:         (event: EffectEvent) => void
  onUnlock?:         (target: UnlockTarget) => void
  onItemUse?:        (event: { id: string; item: ItemDefinition; entry: InventoryEntry | null; inventory: Record<string, unknown> }) => void
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
  questDefinitions: QuestDefinition[]
  listQuests:     () => QuestState[]
  getQuest:       (id: string) => QuestState | null
  setQuestStatus: (id: string, status: QuestStatusValue) => boolean
  advance():      void
  choose(option: ChoiceOption): void
  submitInput(value: string): boolean
  submitSelect(option: SelectOption): boolean
  closeModal():   void
  back():         boolean
  jump(target: string): void
  start():        void
  restart():      void
  exitMenu():     void
  getVar(key: string): unknown
  setVar(key: string, value: unknown): void
  getSetting(key: keyof EngineSettings): unknown
  setSetting(key: keyof EngineSettings, value: unknown): void
  unlock(kind: ProgressKind, id: string): boolean
  inventory: InventoryView
  items: ItemDefinition[]
  itemTypes: Record<string, ItemTypeDefinition>
  getItemDefinition(id: string): ItemDefinition | null
  addItem(id: string, qty?: number, data?: Record<string, unknown> | null): boolean
  removeItem(id: string, qty?: number): boolean
  setItem(id: string, qty?: number, data?: Record<string, unknown> | null): boolean
  useItem(id: string): boolean
  clearItem(id: string): boolean
  clearInventory(): boolean
  getSaveAnchor(cursor?: number): SaveAnchor | null
  resolveSaveAnchor(anchor: SaveAnchor | null | undefined): number | null
  resolveSaveSnapshot(snapshot: SaveSnapshot): SaveSnapshot
  getCurrentLabel(): string | null
  pinia:          import('pinia').Pinia
}
export interface AuthorEngineHandle {
  run: (target: string) => boolean
  jump: (target: string) => boolean
  next: () => void
  back: () => boolean
  restart: () => void
  start: () => void
  exitMenu: () => void
  getVar: (key: string) => unknown
  setVar: (key: string, value: unknown) => boolean
  getSetting: (key: string) => unknown
  setSetting: (key: string, value: unknown) => boolean
  state: VNovaState
  store: VNovaState
}
export declare function createEngine(
  script:  ScriptStep[],
  options?: CreateEngineOptions,
): EngineHandle
export declare function useEngine(): AuthorEngineHandle
// ─── BgLayer (useVNova internal, exposed for custom renderers) ────────────────
export interface BgLayer {
  key:        'a' | 'b'
  src:        Url | null
  color:      CssColor | null
  transition: BgTransition
  active:     boolean
  visible:    boolean
}
// ─── ImageLayer (useVNova internal, exposed for custom renderers) ─────────────
export interface ImageLayer {
  key:        'a' | 'b'
  src:        Url | null
  transition: BgTransition
  fit:        ImageFit
  active:     boolean
  visible:    boolean
}
// ─── useVNova options ─────────────────────────────────────────────────────────
export interface UseVNovaOptions extends CreateEngineOptions {
  typewriterSpeed?:   Milliseconds
  typewriterEnabled?: boolean
  keyboardEnabled?:   boolean
  spacebarFastForward?: SpacebarFastForwardSetting | boolean | 'on'
  /** Optional color used by disabled choice helper text (`disabledText`). */
  choiceDisabledTextColor?: CssColor
  /** localStorage key for save/load. Required to enable save functionality. */
  saveKey?:           string
  /** Enable automatic saves when a label is entered. Default: true. */
  autosave?:          boolean
  /** Debounce before writing the autosave slot, in ms. Default: 600. */
  autosaveDelay?:     Milliseconds
  /** Storage namespace for read/skip progress. Defaults to `saveKey`. */
  readKey?:           string
  /** Storage namespace for meta-progress. Defaults to `readKey`/`saveKey`. */
  progressKey?:       string
  /** Base delay for auto mode after text completes, in ms. Default: 1200. */
  autoDelay?:         Milliseconds
  /** sessionStorage key for session persistence. When provided, engine state is restored on page reload. */
  sessionKey?:        string
}
// ─── useVNova return ──────────────────────────────────────────────────────────
export interface VNovaComposable {
  /** Raw Pinia store (reactive). */
  store:              VNovaState
  current:            ComputedRef<ScriptStep | null>
  awaitingChoice:     ComputedRef<boolean>
  ended:              ComputedRef<boolean>
  stageArray:         ComputedRef<StageCharacter[]>
  background:         ComputedRef<BackgroundState>
  image:              ComputedRef<ImageState>
  history:            ComputedRef<HistoryItem[]>
  canBack:            ComputedRef<boolean>
  speakerName:        ComputedRef<string | null>
  speakerColor:       ComputedRef<CssColor | null>
  quests:             ComputedRef<Record<string, QuestState>>
  userStorage:        UserStorageHandle
  storage:            UserStorageHandle
  displayedText:      ComputedRef<string>
  textComplete:       Ref<boolean>
  bgLayers:           Ref<BgLayer[]>
  bgLayerStyle:       (layer: BgLayer) => CSSProperties
  registerBgElement:  (key: 'a' | 'b', element: HTMLElement | null) => void
  imageLayers:        Ref<ImageLayer[]>
  imageLayerStyle:    (layer: ImageLayer) => CSSProperties
  registerImageElement: (key: 'a' | 'b', element: HTMLElement | null) => void
  registerSpriteElement: (id: string, element: HTMLElement | null) => void
  registerEffectTarget: (target: string, element: HTMLElement | null) => void
  interact():         void
  choose(option: ChoiceOption): void
  submitInput(value: string): boolean
  submitSelect(option: SelectOption): boolean
  closeModal():      void
  back():            boolean
  jump(target: string): void
  start():           void
  restart():         void
  exitMenu():        void
  skipTypewriter():  void
  resumeTypewriter(): void
  autoMode:          Ref<boolean>
  skipMode:          Ref<boolean>
  skipHeld:          Ref<boolean>
  skipActive:        ComputedRef<boolean>
  currentLineRead:   Ref<boolean>
  toggleAuto():      boolean
  toggleSkip():      boolean
  setAutoMode(enabled: boolean): void
  setSkipMode(enabled: boolean): void
  isLineRead(step: ScriptStep): boolean
  clearReadState():  void
  readCount:         Ref<number>
  getVar(key: string): unknown
  setVar(key: string, value: unknown): void
  getSetting(key: keyof EngineSettings): unknown
  setSetting(key: keyof EngineSettings, value: unknown): void
  /** Meta-progress: unlocked CGs, endings, achievements and chapters. */
  progress:          VNovaProgressHandle
  /** Reactive inventory view. */
  inventory:         InventoryView
  /** The underlying engine handle for advanced use. */
  engine:            EngineHandle
}
export declare function useVNovaEngine(
  script:   ScriptStep[],
  options?: UseVNovaOptions,
): VNovaComposable
// ─── useUserStorage ──────────────────────────────────────────────────────────
export declare function useUserStorage(
): UserStorageHandle
// ─── useVNovaAudio ────────────────────────────────────────────────────────────
export interface UseVNovaAudioOptions {
  bgmVolume?:    number
  sfxVolume?:    number
  voiceVolume?:  number
  fadeDuration?: Milliseconds
}
export interface VNovaAudioHandle {
  /** Pass this to `useVNova` / `VNovaStage` as `options.onAudio`. */
  onAudio:       (event: AudioEvent) => void
  bgmVolume:     Ref<number>
  sfxVolume:     Ref<number>
  voiceVolume:   Ref<number>
  setBgmVolume:  (v: number) => void
  setSfxVolume:  (v: number) => void
  setVoiceVolume:(v: number) => void
  stopBgm():     void
  stopVoice():   void
  stopAll():     void
}
export declare function useVNovaAudio(
  options?: UseVNovaAudioOptions,
): VNovaAudioHandle
// ─── useVNovaStore (Pinia) ────────────────────────────────────────────────────
export declare function useVNovaStore(pinia?: Pinia | null): VNovaState
// ─── useQuestEngine ───────────────────────────────────────────────────────────
export declare function useQuestEngine(): {
  QS:         typeof QS
  all:        ComputedRef<Record<string, QuestState>>
  active:     ComputedRef<QuestState[]>
  completed:  ComputedRef<QuestState[]>
  failed:     ComputedRef<QuestState[]>
  status(id: string): QuestStatusValue
  is(id: string, expectedStatus: QuestStatusValue): boolean
  activate(id: string): boolean
  complete(id: string): boolean
  fail(id: string): boolean
  deactivate(id: string): boolean
  list(): QuestState[]
  evaluate(id?: string): boolean
}
// ─── Theme system ─────────────────────────────────────────────────────────────
export interface ThemeDefinition {
  id: string
  name: string
  description?: string
  variables: Record<string, string>
}
export interface ThemeHandle {
  currentThemeId: WritableComputedRef<string>
  currentTheme: ComputedRef<ThemeDefinition | undefined>
  availableThemes: ComputedRef<ThemeDefinition[]>
  applyTheme: (themeId: string) => boolean
  initTheme: () => void
  registerCustomThemes: (themes: ThemeDefinition[]) => void
}
export declare function useTheme(): ThemeHandle
export declare function registerTheme(theme: ThemeDefinition): boolean
export declare function getTheme(id: string): ThemeDefinition | undefined
export declare function getAllThemes(): ThemeDefinition[]
export declare function hasTheme(id: string): boolean
export declare function unregisterTheme(id: string): boolean
export declare function registerThemes(themes: ThemeDefinition[]): void
export declare const builtInThemes: ThemeDefinition[]
export declare const defaultTheme: ThemeDefinition
export declare const darkTheme: ThemeDefinition
export declare const lightTheme: ThemeDefinition
export declare const oceanTheme: ThemeDefinition
export declare const forestTheme: ThemeDefinition
// ─── createQuestEngine ────────────────────────────────────────────────────────
export interface CreateQuestEngineOptions {
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
// ─── validateMultiLanguageScript ─────────────────────────────────────────────
/**
 * Validates a multi-language script object (Record<string, ScriptStep[]>).
 * Checks each language individually and verifies structural equivalence between all translations.
 * @throws {Error} on critical structural or equivalence errors.
 * @returns Array of warning strings (empty = clean).
 */
export declare function validateMultiLanguageScript(
  multiScript:  Record<string, ScriptStep[]>,
  characters?:  CharacterRegistry,
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
  autoMode: ComputedRef<boolean>
  skipMode: ComputedRef<boolean>
  skipActive: ComputedRef<boolean>
  currentLineRead: ComputedRef<boolean>
  hasGallery: ComputedRef<boolean>
  hasInventory: ComputedRef<boolean>
  inventory: ComputedRef<InventoryView | null>
  ui: {
    titleOpen: Ref<boolean>
    settingsOpen: Ref<boolean>
    backlogOpen: Ref<boolean>
    galleryOpen: Ref<boolean>
    inventoryOpen: Ref<boolean>
    creditsOpen: Ref<boolean>
    saveOpen: Ref<boolean>
    saveMode: Ref<'save' | 'load'>
  }
  actions: {
    newGame(): void
    back(): void
    choose(option: ChoiceOption): void
    submitInput(value: string): boolean
    submitSelect(option: SelectOption): boolean
    advance(): void
    closeModal(): void
    restart(): void
    exitMenu(): void
    openSave(): void
    openLoad(): void
    openBacklog(): void
    openGallery(): void
    closeGallery(): void
    openInventory(): void
    closeInventory(): void
    selectChapter(chapter: GalleryItem): boolean
    openCredits(): void
    openSettings(): void
    closeAllModals(): void
    setSetting(key: keyof EngineSettings, value: unknown): void
    toggleAuto(): void
    toggleSkip(): void
    setAutoMode(enabled: boolean): void
    setSkipMode(enabled: boolean): void
  }
  registerStageApi(api: Partial<VNovaStageExposed> | null): void
}
export interface GuiTranslations {
  titleScreen?: {
    newGame?: string
    loadGame?: string
    gallery?: string
    credits?: string
    settings?: string
  }
  hud?: {
    ariaLabel?: string
    back?: string
    log?: string
    gallery?: string
    inventory?: string
    auto?: string
    skip?: string
    save?: string
    load?: string
    settings?: string
    credits?: string
    restart?: string
    quit?: string
  }
  settings?: {
    title?: string
    bgmVolume?: string
    sfxVolume?: string
    voiceVolume?: string
    typewriterSpeed?: string
    spacebarFastForward?: string
    spacebarAriaLabel?: string
    spacebarHelp?: string
    fullspeed?: string
    throttled?: string
    off?: string
    textSize?: string
    textSizeAriaLabel?: string
    small?: string
    medium?: string
    large?: string
    language?: string
    languageAriaLabel?: string
    theme?: string
  }
  saves?: {
    ariaLabel?: string
    title?: string
    close?: string
    inBrowser?: string
    onDisk?: string
    slot?: string
    empty?: string
    overwrite?: string
    yes?: string
    no?: string
    saveHere?: string
    load?: string
    delete?: string
    export?: string
    import?: string
    clearAll?: string
    saveToDisk?: string
    loadFromDisk?: string
    savedToSlot?: string
    saveFailed?: string
    slotLoaded?: string
    loadFailed?: string
    slotCleared?: string
    allSlotsCleared?: string
    exportDownloaded?: string
    exportFailed?: string
    savesImported?: string
    importCancelled?: string
    fileSaved?: string
    fileLoaded?: string
    loadCancelledOrFailed?: string
  }
  gallery?: {
    title?: string
    ariaLabel?: string
    cgs?: string
    endings?: string
    achievements?: string
    chapters?: string
    locked?: string
    empty?: string
    close?: string
    jumpToChapter?: string
  }
  inventory?: {
    title?: string
    empty?: string
    all?: string
    use?: string
    drop?: string
  }
  backlog?: {
    title?: string
    noHistory?: string
    choicePrompt?: string
    chooseOption?: string
    selectedChoice?: string
  }
  credits?: {
    title?: string
    close?: string
  }
  loading?: {
    initializing?: string
    loadingAsset?: string
    loadingAssets?: string
  }
  common?: {
    close?: string
    modal?: string
  }
}
export interface VNovaRuntimeConfig {
  title?: string
  subtitle?: string
  meta?: string
  creditsTitle?: string
  saveKey?: string
  slotCount?: number
  /** Enable automatic saves when a label is entered. Default: true. */
  autosave?: boolean
  /** Debounce before writing the autosave slot, in ms. Default: 600. */
  autosaveDelay?: Milliseconds
  /** Storage namespace for read/skip progress. Defaults to `saveKey`. */
  readKey?: string
  /** Storage namespace for meta-progress. Defaults to `readKey`/`saveKey`. */
  progressKey?: string
  /** Base delay for auto mode after text completes, in ms. Default: 1200. */
  autoDelay?: Milliseconds
  /** Meta-progress gallery definitions (CGs, endings, achievements, chapters). */
  gallery?: GalleryDefinitions
  /** Called after an `unlock` step records meta-progress. */
  onUnlock?: (target: UnlockTarget) => void
  /** Called after a usable item is consumed/handled. */
  onItemUse?: (event: { id: string; item: ItemDefinition; entry: InventoryEntry | null; inventory: Record<string, unknown> }) => void
  /** Inventory modal options. */
  inventory?: { title?: string }
  startLabel?: string
  stage?: UseVNovaOptions
  /** Custom themes to register. Merged with built-in themes. */
  themes?: ThemeDefinition[]
  ui?: {
    /** Enables built-in runtime modal rendering even when no custom modal is registered. */
    autoModal?: boolean
    /** Maps modal `id` (or `step.ui`) to a Vue component rendered by VNovaRuntime. */
    modals?: Record<string, Component>
  }
  /**
   * Custom background for the title screen.
   * Accepts a CSS color/gradient string (e.g. `linear-gradient(...)`, `#abc`) or an asset URL (image path).
   */
  titleBackground?: string
  /** @alias titleBackground */
  titleScreenBackground?: string
  /**
   * Whether to preload all registered assets before showing the title screen.
   * Defaults to `true`. Set to `false` to skip the loading screen entirely.
   */
  preload?: boolean
  /** @alias preload */
  preloadAssets?: boolean
  /**
   * The default language code to use when `script` is a multi-language object.
   * Defaults to the first key in the script object.
   */
  defaultLanguage?: string
  /**
   * GUI translations for different languages.
   * Import locale packs from 'vnova-engine/i18n/*' and pass them here.
   * Example: { es: esLocale, fr: frLocale }
   */
  guiTranslations?: Record<string, GuiTranslations>
  /**
   * Replaces built-in audio playback when provided.
   * If omitted, VNovaRuntime plays audio using its internal player.
   */
  onAudio?: (event: AudioEvent) => void
  onParticles?: (event: ParticlesEvent) => void
  onVideo?: (event: VideoEvent) => void
  onNotify?: (event: NotifyEvent) => void
  /** Set false to disable built-in audio when no onAudio override is provided. */
  audioPlayer?: false
  [key: string]: unknown
}
export interface VNovaRuntimeResolverInput {
  componentName: string
  vnode: unknown
  runtime: VNovaRuntimeContext
  stage: VNovaStageExposed | null
  config: VNovaRuntimeConfig
}
export interface VNovaRuntimeResolverResult {
  props?: Record<string, unknown>
  listeners?: Record<string, (...args: unknown[]) => void>
}
export interface VNovaRuntimeProps {
  /**
   * The visual novel script.
   * Pass a flat `ScriptStep[]` array for a single language,
   * or a `Record<string, ScriptStep[]>` object for multi-language support.
   * Example: `{ en: scriptEn, es: scriptEs }`
   */
  script: ScriptStep[] | Record<string, ScriptStep[]>
  characters?: CharacterRegistry
  assets?: AssetRegistry
  credits?: CreditsRegistry
  particles?: ParticleRegistry
  items?: Record<string, ItemDefinition> | ItemDefinition[]
  itemTypes?: Record<string, ItemTypeDefinition> | ItemTypeDefinition[]
  config?: VNovaRuntimeConfig
  /** Direct modal registry shortcut (merged over config.ui.modals). */
  modals?: Record<string, Component>
  componentResolvers?: Record<string, (input: VNovaRuntimeResolverInput) => VNovaRuntimeResolverResult | null | undefined>
}
/** Methods/state exposed via `ref` on VNovaStage. */
export interface VNovaStageExposed {
  interact():   void
  choose(option: ChoiceOption): void
  submitInput(value: string): boolean
  submitSelect(option: SelectOption): boolean
  closeModal(): void
  back():       boolean
  jump(target: string): void
  restart():    void
  save():       true | undefined
  load():       boolean
  saveAuto():   Promise<boolean>
  loadAuto():   Promise<boolean>
  clearSave():  void
  openSave():   void
  openLoad():   void
  closeSave():  void
  saveOpen:     Ref<boolean>
  saveMode:     Ref<'save' | 'load'>
  currentLineRead?: Ref<boolean>
  autoMode?:      Ref<boolean>
  skipMode?:      Ref<boolean>
  skipActive?:    ComputedRef<boolean>
  toggleAuto():   boolean
  toggleSkip():   boolean
  setAutoMode(enabled: boolean): void
  setSkipMode(enabled: boolean): void
  isLineRead(step: ScriptStep): boolean
  clearReadState(): void
  readCount: Ref<number>
  progress: VNovaProgressHandle
  inventory: InventoryView
  exitMenu():   void
  resumeTypewriter(): void
  canBack:      ComputedRef<boolean>
  hasSave:      Ref<boolean>
  hasAuto:      ComputedRef<boolean>
  autoSlot:     Ref<SlotMeta | null>
  history:      ComputedRef<ScriptStep[]>
  listQuests(): QuestState[]
  getQuest(id: string): QuestState | null
  setQuestStatus(id: string, status: QuestStatusValue): boolean
  getVar(key: string): unknown
  setVar(key: string, value: unknown): void
  getSetting(key: keyof EngineSettings): unknown
  setSetting(key: keyof EngineSettings, value: unknown): void
  userStorage: UserStorageHandle
  storage: UserStorageHandle
  state: VNovaState
}
// ─── meta-progress / gallery ──────────────────────────────────────────────────
export interface VNovaProgressState {
  cgs: string[]
  endings: string[]
  achievements: string[]
  chapters: string[]
}
export interface VNovaProgressHandle {
  key: string
  state: Readonly<Ref<VNovaProgressState>>
  counts: ComputedRef<{ cg: number; ending: number; achievement: number; chapter: number }>
  has(kind: ProgressKind | string, id: string): boolean
  unlock(kind: ProgressKind | string, id: string): boolean
  unlockMany(entries: UnlockTarget[]): number
  reset(kind?: ProgressKind | string | null): void
  flush(): void
}
export interface GalleryItem {
  id: string
  title?: string
  description?: string
  /** CG/screenshot URL. */
  src?: Url
  thumbnail?: Url
  /** Hide the real title while locked. */
  hidden?: boolean
  /** Chapter label to jump to. */
  label?: string
}
export interface GalleryDefinitions {
  title?: string
  cgs?: GalleryItem[]
  endings?: GalleryItem[]
  achievements?: GalleryItem[]
  chapters?: GalleryItem[]
}
export interface ItemTypeDefinition {
  id?: string
  /** Inherit behavior/defaults from another type. */
  extends?: string
  label?: string
  icon?: string
  color?: string
  slot?: string
  stackable?: boolean
  consumable?: boolean
  unique?: boolean
  maxStack?: number
  usable?: boolean
  [key: string]: unknown
}
export interface ItemUseEffects {
  set?: Record<string, unknown>
  inc?: Record<string, number>
  unset?: string[]
  notify?: NotifyEvent | NotifyEvent[]
  unlock?: UnlockTarget | UnlockTarget[] | Record<string, unknown>
  sfx?: string | { id?: string; src?: Url; volume?: number }
}
export interface ItemDefinition extends ItemTypeDefinition {
  id: string
  /** Primary type, or `[primary, ...secondary]`. */
  type?: string | string[]
  types?: string[]
  tags?: string[]
  name?: string
  description?: string
  use?: ItemUseEffects
}
export interface InventoryEntry extends ItemDefinition {
  primaryType: string
  types: string[]
  tags: string[]
  qty: number
  data: Record<string, unknown> | null
  missing?: boolean
}
export interface InventoryView {
  types: Record<string, ItemTypeDefinition>
  definitions: ItemDefinition[]
  definition(id: string): ItemDefinition | null
  entries: ComputedRef<InventoryEntry[]>
  get(id: string): InventoryEntry | null
  count(id: string): number
  has(id: string, qty?: number): boolean
  hasType(type: string): boolean
  typeCount(type: string): number
  byType(type: string): InventoryEntry[]
  add(id: string, qty?: number, data?: Record<string, unknown> | null): boolean
  remove(id: string, qty?: number): boolean
  set(id: string, qty?: number, data?: Record<string, unknown> | null): boolean
  use(id: string): boolean
  clear(id: string): boolean
  clearAll(): boolean
}
export declare function useVNovaInventory(): InventoryView
export declare function useVNovaProgress(key?: string): VNovaProgressHandle
export declare function resetAllProgress(): void
export declare function normalizeProgressKind(kind: string): string | null

// ─── useVNovaSaves ────────────────────────────────────────────────────────────
export interface SaveAnchor {
  /** Nearest authored label before the saved cursor, or null. */
  label:  string | null
  /** Steps between the label and the saved line. */
  offset: number
  /** Raw runtime cursor at save time (legacy fallback). */
  cursor: number
}
export interface SaveSnapshot {
  cursor:         number
  current:        ScriptStep | null
  anchor?:        SaveAnchor | null
  lastLabel?:     string | null
  stage:          Record<string, StageCharacter>
  background:     BackgroundState
  image:          ImageState
  video:          VideoEvent | null
  bgm:            Url | null
  particles:      { action: 'play' | 'stop'; id: string | null; config: ParticlePreset | null } | null
  vars:           Record<string, unknown>
  quests:         Record<string, QuestState>
  awaitingChoice: boolean
  ended:          boolean
  history:        ScriptStep[]
  backStack:      StateDiff[][]
  settings:       EngineSettings
}
export interface SlotMeta {
  slot:          number | 'auto'
  kind:          'slot' | 'auto'
  label:         string | null
  chapter:       string | null
  preview:       string | null
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
  autoSlot:     Ref<SlotMeta | null>
  hasSave:      ComputedRef<boolean>
  hasAuto:      ComputedRef<boolean>
  saving:       Ref<boolean>
  autosaving:   Ref<boolean>
  lastFileError: Ref<{ code: string; message: string } | null>
  saveSlot:     (slot: number) => Promise<boolean>
  saveAuto:     () => Promise<boolean>
  loadSlot:     (slot: number) => Promise<boolean>
  loadAuto:     () => Promise<boolean>
  deleteSlot:   (slot: number) => void
  deleteAuto:   () => void
  clearAll:     () => void
  exportSaves:  () => Promise<boolean>
  importSaves:  () => Promise<boolean>
  saveToDisk:   () => Promise<boolean>
  loadFromDisk: () => Promise<boolean>
  refresh:      () => Promise<void>
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
  loaded:  [slot: number | 'auto']
  deleted: [slot: number]
}
export declare const VNovaSaveModal: DefineComponent<VNovaSaveModalProps, Record<string, never>, VNovaSaveModalEmits>
export declare const VNOVA_RUNTIME_CONTEXT_KEY: 'vnova-runtime'
export declare const VNovaRuntime: DefineComponent<VNovaRuntimeProps>
export declare const VNovaStage:      DefineComponent<VNovaStageProps, VNovaStageExposed, VNovaStageEmits>
export declare const VNovaTitleScreen: DefineComponent<{ visible?: boolean; hasSave?: boolean; hasCredits?: boolean; hasGallery?: boolean; title?: string; subtitle?: string; meta?: string; background?: string }>
export declare const VNovaCreditsScreen: DefineComponent<{ open?: boolean; title?: string; credits?: CreditsRegistry }>
export declare const VNovaHud: DefineComponent<
  { canBack?: boolean; audioLog?: string; visible?: boolean; showBacklog?: boolean; showGallery?: boolean; showInventory?: boolean; showCredits?: boolean },
  Record<string, never>,
  { back: []; 'open-save': []; 'open-load': []; 'open-backlog': []; 'open-gallery': []; 'open-inventory': []; 'open-credits': []; 'open-settings': []; restart: []; 'exit-menu': [] }
>
export declare const VNovaTopHud: DefineComponent<
  { opacity?: number; floating?: boolean; customClass?: string | string[] | Record<string, boolean> | null }
>
export declare const VNovaSettingsModal: DefineComponent<{
  open?: boolean
  bgmVolume?: number
  sfxVolume?: number
  voiceVolume?: number
  typewriterSpeed?: number
  spacebarFastForward?: 'fullspeed' | 'throttled' | 'off'
  textSize?: 'small' | 'medium' | 'large'
  /** Array of available language codes (e.g. ['en', 'es']). When non-empty, shows a language selector. */
  languages?: string[]
  /** Currently selected language code. */
  language?: string
  /** Array of available themes. */
  themes?: ThemeDefinition[]
  /** Currently selected theme ID. */
  currentTheme?: string
}>
export declare const VNovaBacklogModal:  DefineComponent<{ history?: ScriptStep[] }>
export declare const VNovaGalleryModal: DefineComponent<
  { open?: boolean; title?: string; progressKey?: string; gallery?: GalleryDefinitions },
  Record<string, never>,
  { close: []; 'select-chapter': [chapter: GalleryItem] }
>
export declare const VNovaInventoryModal: DefineComponent<
  { open?: boolean; title?: string },
  Record<string, never>,
  { close: [] }
>
// ─── VNovaLoadingScreen ───────────────────────────────────────────────────────
export declare const VNovaLoadingScreen: DefineComponent<{
  /** Preload progress from 0 to 1. */
  progress?: number
  /** URL or name of the asset currently being loaded (for display). */
  currentAsset?: string
}>
// ─── read tracker / voice bus ────────────────────────────────────────────────
export interface VNovaReadTracker {
  key: string
  size: Ref<number>
  isRead(step: ScriptStep): boolean
  markRead(step: ScriptStep): boolean
  reset(): void
  flush(): void
}
export declare function lineReadKey(step: ScriptStep): string | null
export declare function useVNovaReadTracker(key?: string): VNovaReadTracker
export declare function resetAllReadTrackers(): void
export declare const voicePlaying: Ref<boolean>
export declare const voiceTrack: Ref<Url | null>
export declare const voiceDuration: Ref<number>
