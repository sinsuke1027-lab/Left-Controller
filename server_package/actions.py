import pyautogui
import platform

# Fail-safe to move mouse to corner to abort (good practice with pyautogui)
# Fail-safe to move mouse to corner to abort (good practice with pyautogui)
pyautogui.FAILSAFE = True

def map_keys(keys: list) -> list:
    """
    Maps keys based on the operating system.
    Converts Windows-standard keys to macOS equivalents if running on a Mac.
    """
    if platform.system() != "Darwin":
        return keys

    mapped_keys = []
    for k in keys:
        k = k.lower()
        if k == "ctrl":
            mapped_keys.append("command")
        elif k == "alt":
            mapped_keys.append("option")
        elif k == "win":
            mapped_keys.append("command")
        else:
            mapped_keys.append(k)
    return mapped_keys

def execute_action(action_type: str, params: list):
    """
    Executes the specified action.
    """
    try:
        if action_type == "hotkey":
            # Map keys based on OS
            final_keys = map_keys(params)
            pyautogui.hotkey(*final_keys)
            print(f"Executed hotkey: {final_keys} (Original: {params})")
            
        elif action_type == "press":
            # Example: ["enter"]
            pyautogui.press(params[0])
            print(f"Executed press: {params[0]}")
            
        elif action_type == "type":
            # Example: ["Hello"]
            pyautogui.write(params[0])
            print(f"Typed: {params[0]}")
            
        elif action_type == "open_url":
            import webbrowser
            url = params[0]
            webbrowser.open(url)
            print(f"Opened URL: {url}")

        elif action_type == "open_app":
            import subprocess
            import os
            app_path = params[0]
            if platform.system() == "Darwin":
                subprocess.run(["open", app_path])
            else:
                os.startfile(app_path)
            print(f"Opened App: {app_path}")

        elif action_type == "system":
            # Example: ["mute"]
            cmd = params[0]
            if cmd == "mute":
                if platform.system() == "Darwin":
                    import os
                    # Toggle mute on Mac
                    os.system("osascript -e 'set volume output muted not (output muted of (get volume settings))'")
                else:
                    pyautogui.press("volumemute")
            print(f"Executed system command: {cmd}")

        else:
            print(f"Unknown action type: {action_type}")
            
    except Exception as e:
        print(f"Error executing action {action_type}: {e}")
