import { useEffect, useState } from "react"
import "./App.css"
import automationrules from "automation-rules"
import type { Operator } from "automation-rules"
import { params, triggers } from "./arconfig"

type Person = {
  name: string
  age: number
  hometown: string
}

// Generate callback functions
const getAlertCallback = (msg: string) => () => alert(msg)
const getBackgroundColorCallback = (color: string) => () => {
  document.getElementsByTagName("body")[0].style.backgroundColor = color
}

type Action = "Show an alert" | "Change background"

// Enable logging for successes and failures
automationrules.log.setLogging({ onSuccess: true, onFailure: true })
// See the useEffect hook below for setting the logging callback

// Get values for UI select dropdowns
const personParamKeys = automationrules.params.keys.getAllBySchema(
  params,
  "person"
)
const personTriggerEvents = automationrules.triggers.events.getAllBySchema(
  triggers,
  "person"
)

// Create types for React
type PersonTriggerEvent = (typeof personTriggerEvents)[number]
type PersonParamKey = (typeof personParamKeys)[number]

function App() {
  const [people, setPeople] = useState<Person[]>([])
  const [newRuleTriggerEvent, setNewRuleTrigger] = useState<PersonTriggerEvent>(
    personTriggerEvents[0]
  )
  const [newRuleParamKey, setNewRuleParamKey] = useState<PersonParamKey>(
    personParamKeys[0]
  )
  const [newRuleParamValue, setNewRuleParamValue] = useState<string | number>(
    ""
  )
  const [newRuleAction, setNewRuleAction] = useState<Action>("Show an alert")
  const [newRuleOperator, setNewRuleOperator] = useState<Operator>("equals")
  const [newRuleActionValue, setNewRuleActionValue] = useState("")
  const [newRuleName, setNewRuleName] = useState("")
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    // Define how to log successes and failures of rules (optional)

    // Note: The callback gives you access to 4 things:
    // 1. The rule,
    // 2. Whether or not the rule was successful
    // 3. The data evaluated
    // 4. If the rule was not successful, the first condition that failed.

    automationrules.log.setLogCallback((rule, isSuccess, person) => {
      const ruleResult = isSuccess ? "SUCCESS" : "FAIL"
      setLogs((logs) => [
        ...logs,
        `${ruleResult}: ${rule.description} (${person.name}, ${person.age}, ${person.hometown})`,
      ])
    })
  }, [])

  const addNewPerson = () => {
    const name = String(prompt("Enter person's name"))
    const age = Number(prompt("Enter person's age"))
    const hometown = String(prompt("Enter person's hometown"))
    setPeople((people) => [...people, { name, age, hometown }])

    // Execute all created rules with the create person trigger
    const personCreatedTrigger = automationrules.triggers.getBySchemaAndEvent(
      triggers,
      "person",
      "created"
    )

    automationrules.rules.executeAllByTrigger(personCreatedTrigger, {
      name,
      age,
      hometown,
    })
  }

  const removePerson = (i: number) => {
    // Execute all created rules with the delete person trigger
    const personRemovedTrigger = automationrules.triggers.getBySchemaAndEvent(
      triggers,
      "person",
      "deleted"
    )
    automationrules.rules.executeAllByTrigger(personRemovedTrigger, people[i])

    // Remove the person
    setPeople((people) => [...people.slice(0, i), ...people.slice(i + 1)])
  }

  const clearRuleParams = () => {
    setNewRuleTrigger("created")
    setNewRuleParamKey("name")
    setNewRuleOperator("equals")
    setNewRuleAction("Show an alert")
    setNewRuleParamValue("")
    setNewRuleActionValue("")
    setNewRuleName("")
  }

  const createNewRule = () => {
    // Use the parameter, operator and value provided by the user
    const selectedParam = automationrules.params.getBySchemaAndKey(
      params,
      "person",
      newRuleParamKey
    )
    const condition = automationrules.conditions.create(
      selectedParam,
      newRuleOperator,
      newRuleParamValue
    )

    const callback =
      newRuleAction === "Show an alert"
        ? getAlertCallback(newRuleActionValue)
        : getBackgroundColorCallback(newRuleActionValue)

    const callbackDescription =
      newRuleAction === "Show an alert"
        ? `Show alert "${newRuleActionValue}"`
        : `Set background to "${newRuleActionValue}"`

    // Create a new rule with paramters provided by the user
    const selectedTrigger = automationrules.triggers.getBySchemaAndEvent(
      triggers,
      "person",
      newRuleTriggerEvent
    )
    automationrules.rules.create(
      selectedTrigger,
      [condition],
      callback,
      callbackDescription,
      newRuleName
    )

    // Clear form inputs and hide form
    clearRuleParams()
    alert("params cleared!")
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2 min-h-[500px]">
        <div className="bg-slate-100 py-4 px-2 rounded">
          <h1>Create an automation rule</h1>
          <h3 className="italic w-full text-center px-4">
            (You'll build a UI like this in your app for users to create their
            own rules.)
          </h3>
          <div className="text-left mt-8 p-3 flex flex-col gap-4">
            <div className="grid grid-cols-2">
              <div>
                <span>When a person is...</span>
              </div>
              <select
                className="border-[1px] border-solid border-black p-2 rounded-md"
                onChange={(e) => setNewRuleTrigger(JSON.parse(e.target.value))}
                value={newRuleTriggerEvent}
              >
                {automationrules.triggers
                  .getAllBySchema(triggers, "person")
                  .map((trigger) => (
                    <option value={JSON.stringify(trigger)}>
                      {trigger.event}
                    </option>
                  ))}
              </select>
            </div>
            <div className="grid grid-cols-2">
              <div>
                <span className="mr-2">Select param</span>
              </div>
              <select
                className="border-[1px] border-solid border-black p-2 rounded-md"
                onChange={(e) =>
                  setNewRuleParamKey(JSON.parse(e.target.value).key)
                }
                value={newRuleParamKey}
              >
                {automationrules.params
                  .getAllBySchema(params, "person")
                  .map((param) => (
                    <option value={JSON.stringify(param)}>{param.key}</option>
                  ))}
              </select>
            </div>
            <div className="grid grid-cols-2">
              <div>
                <span className="mr-2">Select operator</span>
              </div>
              <select
                className="border-[1px] border-solid border-black p-2 rounded-md"
                onChange={(e) => setNewRuleOperator(e.target.value as Operator)}
              >
                {automationrules.operators.map((op) => (
                  <option>{op}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2">
              <div>
                <span className="mr-2">Desired value</span>
              </div>
              <input
                className="border-[1px] border-solid border-black p-2 rounded-md"
                onChange={(e) => {
                  {
                    setNewRuleParamValue(
                      newRuleParamKey === "age"
                        ? Number(e.target.value)
                        : e.target.value
                    )
                  }
                }}
                value={newRuleParamValue}
              />
            </div>
            <div className="grid grid-cols-2">
              <div>
                <span className="mr-2">Select action</span>
              </div>
              <select
                className="border-[1px] border-solid border-black p-2 rounded-md"
                onChange={(e) => {
                  setNewRuleAction(e.target.value as Action)
                }}
              >
                {["Show an alert", "Change background"].map((action) => (
                  <option>{action}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2">
              <div>
                <span className="mr-2">
                  {newRuleAction === "Show an alert"
                    ? "Alert text"
                    : "Background color"}
                </span>
              </div>
              <input
                className="border-[1px] border-solid border-black p-2 rounded-md"
                onChange={(e) => {
                  setNewRuleActionValue(e.target.value)
                }}
              />
            </div>
            <div className="grid grid-cols-2">
              <div>
                <span className="mr-2">Rule name</span>
              </div>
              <input
                className="border-[1px] border-solid border-black p-2 rounded-md"
                onChange={(e) => {
                  setNewRuleName(e.target.value)
                }}
              />
            </div>
            <div className="text-center py-4">
              <button
                className="text-white bg-blue-900 w-[150px]"
                onClick={createNewRule}
              >
                Create
              </button>
            </div>
          </div>
        </div>
        <div className="text-left bg-slate-100 py-4 px-2 rounded grid grid-rows-2">
          <div>
            <h1 className="font-bold mb-3 text-center">Rules</h1>
            {/* Use getRules() to return an array of the active rules */}
            {automationrules.rules.getAll().map((rule) => (
              <div className="p-2 border-solid border-[1px] border-slate-400 mb-2 rounded">
                <div>
                  <span className="font-bold text-sm text-slate-600">
                    {rule.description}
                  </span>
                </div>
                <div>
                  <span className="text-sm">
                    <span className="font-bold">{rule.trigger.event}</span> and{" "}
                    <span className="font-bold text-blue-600">
                      {rule.conditions[0].param.key}{" "}
                    </span>
                    {rule.conditions[0].operator}{" "}
                    <span className="font-bold text-orange-600">
                      {rule.conditions[0].value}
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-sm ml-2">
                    {"=>"} {rule.callbackDescription}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div>
            <h1 className="text-center">Logs</h1>
            <div className="text-left">
              {logs.map((log) => (
                <div className="block border border-slate-500 my-2 p-2 rounded text-sm">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-slate-900 py-4 px-2 rounded-lg text-white">
          <h1 className="text-white">App Simulation</h1>
          <button
            className="bg-green-600 text-white font-bold w-[200px] rounded-full"
            onClick={addNewPerson}
          >
            Create new person
          </button>
          <div className="text-left mt-8">
            <div className="grid grid-cols-4">
              <div className="font-bold border-b border-white">Name</div>
              <div className="font-bold border-b border-white text-center">
                Age
              </div>
              <div className="font-bold border-b border-white text-center">
                Hometown
              </div>
              <div className="font-bold border-b border-white text-center">
                Delete
              </div>
              {people.map((person, i) => (
                <>
                  <div className="py-4">{person.name}</div>
                  <div className="py-4 text-center">{person.age}</div>
                  <div className="py-4 text-center">{person.hometown}</div>
                  <div className="py-4 text-center">
                    <button
                      className="bg-red-600 text-white font-extrabold mr-1 rounded-full py-1 px-2 cursor-pointer hover:bg-red-700 text-sm"
                      onClick={() => removePerson(i)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
