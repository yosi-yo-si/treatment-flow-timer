(function attachStorageInfra(global) {
  const KEYS = {
    conditionInput: "treatmentConditionInput",
    scheduleOutput: "treatmentScheduleOutput",
  };

  function safeParse(rawValue, fallback) {
    if (!rawValue) return fallback;

    try {
      return JSON.parse(rawValue);
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    global.sessionStorage.setItem(key, JSON.stringify(value));
  }

  function loadJSON(key, fallback) {
    const raw = global.sessionStorage.getItem(key);
    return safeParse(raw, fallback);
  }

  function saveConditionInput(payload) {
    saveJSON(KEYS.conditionInput, payload);
  }

  function loadConditionInput(fallback) {
    return loadJSON(KEYS.conditionInput, fallback);
  }

  function saveScheduleOutput(payload) {
    saveJSON(KEYS.scheduleOutput, payload);
  }

  function loadScheduleOutput(fallback) {
    return loadJSON(KEYS.scheduleOutput, fallback);
  }

  global.TreatmentFlowInfra = global.TreatmentFlowInfra || {};
  global.TreatmentFlowInfra.storage = {
    KEYS,
    saveConditionInput,
    loadConditionInput,
    saveScheduleOutput,
    loadScheduleOutput,
  };
})(window);
