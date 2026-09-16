Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
projectDir = "c:\Users\Nihal Wesly G\mern-project"
WshShell.CurrentDirectory = projectDir

' 1. Check & start MongoDB
Set execObj = WshShell.Exec("cmd /c netstat -ano | findstr :27017 | findstr LISTENING")
mongoRunning = Not execObj.StdOut.AtEndOfStream
If Not mongoRunning Then
    WshShell.Run "cmd /c """ & "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe"" --dbpath """ & projectDir & "\mongodb_data"" --bind_ip 127.0.0.1 --logpath """ & projectDir & "\mongo.log""", 0, False
    WScript.Sleep 1500
End If

' 2. Check & start Node backend server
Set execObj = WshShell.Exec("cmd /c netstat -ano | findstr :5000 | findstr LISTENING")
nodeRunning = Not execObj.StdOut.AtEndOfStream
If Not nodeRunning Then
    WshShell.Run "cmd /c node server/index.js", 0, False
    WScript.Sleep 1500
End If

' 3. Check & start Cloudflare Internet Tunnel for phone app
Set execObj = WshShell.Exec("cmd /c tasklist /FI ""IMAGENAME eq cloudflared.exe"" | findstr cloudflared")
tunnelRunning = Not execObj.StdOut.AtEndOfStream
If Not tunnelRunning Then
    WshShell.Run "cmd /c node run_tunnel.cjs", 0, False
End If

' 4. Check if Vite dev server is running on 5173, else use production 5000
targetUrl = "http://localhost:5000"
Set execObj = WshShell.Exec("cmd /c netstat -ano | findstr :5173 | findstr LISTENING")
If Not execObj.StdOut.AtEndOfStream Then
    targetUrl = "http://localhost:5173"
End If

' 5. Open Chrome App
chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
If fso.FileExists(chromePath) Then
    WshShell.Run """" & chromePath & """ --app=" & targetUrl & " --app-id=crewlink", 1, False
Else
    WshShell.Run targetUrl, 1, False
End If
