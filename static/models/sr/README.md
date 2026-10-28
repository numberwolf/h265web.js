# SR engineering model

Fixed AN weights from WebSR commit `a756eb82ec7d95553bded6bbd669d85bf2b288ff`, `weights/anime4k/cnn-2x-s-an.json`, originally Anime4K by bloc97. Both MIT notices are retained alongside these weights. See the fixed manifest for SHA-256, byte length and supported recipe. This is an experimental engineering baseline, not a claim of native detail recovery or production quality approval. No ORT dependency is shipped.

Unknown/HDR input must bypass; only explicit SDR input can be evaluated. Policy caps apply independently of the native x2 network. Model asset requests occur only after explicit enable and eligible source/display geometry.
