<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $certificate->certificate_number }}</title>
    <style>
        @page { size: a4 landscape; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }

        /* ── Custom Font Embedding ── */
        @php
            $fontAlgerian  = 'file://' . str_replace('\\', '/', public_path('fonts/Algerian.ttf'));
            $fontLucida    = 'file://' . str_replace('\\', '/', public_path('fonts/LucidaCalligraphy.ttf'));
            $fontPerpetua  = 'file://' . str_replace('\\', '/', public_path('fonts/PerpetuaTitling.ttf'));
            $fontBrush     = 'file://' . str_replace('\\', '/', public_path('fonts/BrushScriptMT.ttf'));
            $fontPerpetuaReg = 'file://' . str_replace('\\', '/', public_path('fonts/Perpetua.ttf'));
        @endphp
        @font-face {
            font-family: 'Algerian';
            src: url("{{ $fontAlgerian }}") format('truetype');
            font-weight: normal;
        }
        @font-face {
            font-family: 'Algerian';
            src: url("{{ $fontAlgerian }}") format('truetype');
            font-weight: bold; /* Maps bold requests to the same TTF */
        }
        @font-face {
            font-family: 'LucidaCalligraphy';
            src: url("{{ $fontLucida }}") format('truetype');
            font-weight: normal;
        }
        @font-face {
            font-family: 'PerpetuaTitling';
            src: url("{{ $fontPerpetua }}") format('truetype');
            font-weight: normal;
        }
        @font-face {
            font-family: 'BrushScriptMT';
            src: url("{{ $fontBrush }}") format('truetype');
            font-weight: normal;
        }
        @font-face {
            font-family: 'Perpetua';
            src: url("{{ $fontPerpetuaReg }}") format('truetype');
            font-weight: normal;
        }

        body {
            font-family: 'Times New Roman', Times, serif;
            margin: 0; padding: 0;
            width: 297mm; height: 210mm;
            color: #000;
        }

        /* Frame image - exact Publisher measurements:
           Position: Horizontal 1cm (10mm) from left, Vertical 0.8cm (8mm) from top
           Size: 27.6cm (276mm) wide x 19.4cm (194mm) tall */
        .bg-frame {
            position: absolute;
            top: 8mm;
            left: 10mm;
            width: 276mm;
            height: 194mm;
            z-index: 0;
        }

        /* 
           Adjusted relative to visual center of PNG frame to equalize borders 
           and matched requested gap sizes.
        */
        .content-box {
            position: absolute;
            z-index: 1;
            top: 23mm;
            left: 27mm;
            width: 238mm;
            height: 160mm;
            background: white;
            border: 1pt solid #000;
            display: flex;
            flex-direction: column;
            padding: 1mm;
        }

        /* ── HEADER ── */
        .header-table {
            width: 100%;
            margin-bottom: 2mm;
            border-collapse: collapse;
        }
        .header-table td {
            vertical-align: bottom;
        }
        .pt-name  { font-size: 18pt; font-weight: bold; letter-spacing: 0.5px; text-align: left; }
        .cert-no  { font-size: 18pt; font-weight: bold; text-align: right; }

        /* ── TITLE BLOCK ── */
        .title-block { 
            text-align: center; 
            margin-top: 6mm;
        }

        .main-title {
            font-family: 'Algerian', 'Times New Roman', serif;
            font-size: 26pt;
            font-weight: bold;
            letter-spacing: 5px;
            /* Extra text-shadow for a faux-thicker bold stroke on DOMPDF */
            text-shadow: 0.3px 0 0 #000, 0 0.3px 0 #000;
            text-transform: uppercase;
            border-bottom: 2px solid #000;
            display: block;
            margin: 0 auto 1mm auto;
            width: 230mm;
            padding-bottom: 2mm;
        }

        .instrument-name {
            font-family: 'LucidaCalligraphy', 'Times New Roman', serif;
            font-size: 24pt;
            font-weight: normal;
            font-style: normal;
            margin: 0;
            line-height: 1;
        }

        .granted-to {
            font-family: 'BrushScriptMT', cursive;
            font-size: 26pt;
            font-weight: normal;
            font-style: normal;
            margin: -2mm 0 0 0;
            line-height: 1;
        }

        .hospital-name {
            font-family: 'PerpetuaTitling', 'Times New Roman', serif;
            font-size: 24pt;
            font-weight: bold;
            color: #0070C0; /* Dark blue matching the Publisher palette */
            text-transform: uppercase;
            letter-spacing: 3px;
            margin: 0;
            border-bottom: 1px solid #000;
            display: inline-block;
            min-width: 60%;
            padding-bottom: 1mm;
        }

        /* ── DETAILS BLOCK ── */
        .details {
            font-family: 'Perpetua', 'Times New Roman', serif;
            text-align: center;
            font-size: 20pt;
            line-height: 1.1;
            margin-top: 0;
        }

        .final-result-label {
            font-family: 'LucidaCalligraphy', 'Times New Roman', serif;
            font-size: 17pt;
            font-weight: normal;
            margin-top: 0;
        }

        .passed {
            font-family: 'Perpetua', 'Times New Roman', serif;
            font-size: 22pt;
            font-weight: bold;
            letter-spacing: 1px;
            margin-top: 0;
            display: inline-block;
            padding: 0 4mm;
        }

        /* ── SIGNATURES - table layout for dompdf ── */
        .sig-table {
            width: 100%;
            margin-top: 2mm;
            border-collapse: collapse;
        }
        .sig-td-side {
            width: 35%; /* Fixed boundaries force columns strictly left and right */
            text-align: center;
            vertical-align: bottom;
            padding: 0;
        }
        .sig-spacer {
            width: 30%; /* Large empty space rigidly isolates text from each other */
        }
        .sig-img {
            height: 90px;
            max-width: 170px;
            display: block;
            margin: 0 auto;
        }
        .sig-name-line {
            border-bottom: 1px solid #000;
            display: block;
            width: 100%;
            padding-bottom: 0;
            margin-bottom: 0;
            font-family: 'Perpetua', 'Times New Roman', serif;
            font-size: 18pt;
            font-weight: normal;
            text-align: center;
            line-height: 1.1;
        }
        .sig-role {
            font-family: 'Perpetua', 'Times New Roman', serif;
            font-size: 18pt;
            text-align: center;
            margin-top: 0;
            line-height: 1.1;
        }
    </style>
</head>
<body>
    @php
        $framePath = base_path('frame.png');
        $frameData = base64_encode(file_get_contents($framePath));

        // Smart signature finder: try full name, UPPERCASE full, first word UPPERCASE
        function findSig($name, $dir) {
            $candidates = [$name, strtoupper($name), strtoupper(explode(' ', trim($name))[0])];
            foreach ($candidates as $n) {
                foreach (['.png', '.jpg', '.jpeg'] as $ext) {
                    $p = $dir . DIRECTORY_SEPARATOR . $n . $ext;
                    if (file_exists($p)) return $p;
                }
            }
            return null;
        }

        $ttdDir = base_path('TTD');
        $techSig = findSig($certificate->technician_name, $ttdDir);
        $mgrSig  = findSig($certificate->supervisor_name,  $ttdDir);

        $resultText   = strtoupper($certificate->result ?? 'PASSED');
        $spacedResult = implode(' ', str_split($resultText));
    @endphp

    <img src="data:image/png;base64,{{ $frameData }}" class="bg-frame">

    <div class="content-box">

        {{-- HEADER --}}
        <table class="header-table">
            <tr>
                <td class="pt-name">{{ $certificate->pt_name }}</td>
                <td class="cert-no">NO : {{ $certificate->certificate_number }}</td>
            </tr>
        </table>

        {{-- TITLE --}}
        <div class="title-block">
            <div class="main-title">Certificate of Calibration</div>
            <div class="instrument-name">{{ $certificate->instrument_name }}</div>
            <div class="granted-to">Is hereby granted to :</div>
            <div class="hospital-name">{{ $certificate->hospital_name }}</div>
        </div>

        {{-- DETAILS --}}
        <div class="details">
            <div>Serial  Number : {{ $certificate->serial_number }}</div>
            <div>Date of Calibration : {{ $certificate->calibration_date->format('F jS, Y') }}</div>
            <div>Valid Until : {{ $certificate->expiry_date->format('F jS, Y') }}</div>
            <div class="final-result-label">The Final Result :</div>
            <div class="passed">{{ $spacedResult }}</div>
        </div>

        {{-- SIGNATURES: table layout so dompdf renders side-by-side --}}
        <table class="sig-table">
            <tr>
                <td class="sig-td-side">
                    @if($techSig)
                        <img class="sig-img"
                             src="data:image/png;base64,{{ base64_encode(file_get_contents($techSig)) }}">
                    @else
                        <div style="height:90px;"></div>
                    @endif
                    <span class="sig-name-line">{{ $certificate->technician_name }}</span>
                    <div class="sig-role">Technical</div>
                </td>
                <td class="sig-spacer"></td>
                <td class="sig-td-side">
                    @if($mgrSig)
                        <img class="sig-img"
                             src="data:image/png;base64,{{ base64_encode(file_get_contents($mgrSig)) }}">
                    @else
                        <div style="height:90px;"></div>
                    @endif
                    <span class="sig-name-line">{{ $certificate->supervisor_name }}</span>
                    <div class="sig-role">Customer Support Manager</div>
                </td>
            </tr>
        </table>

    </div>
</body>
</html>
