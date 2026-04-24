<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title></title>
    <style>
        @page { 
            size: 54mm 86mm; 
            margin: 0; 
        }
        
        @media print {
            body { margin: 0; background: none; }
            .no-print { display: none !important; }
            .id-card { margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
        }

        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; padding: 0; background: #f4f7f6; 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .id-card {
            width: 54mm; height: 86mm;
            background: #fff; position: relative;
            overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            margin: 20px auto; border-radius: 10px;
        }

        /* Header: Fade linear dari atas (biru gelap) ke bawah (transparan) */
        .header {
            height: 36mm; 
            background: linear-gradient(180deg, #0d1b4e 0%, #1565c0 60%, #1e88e5 100%);
            position: relative; display: flex; flex-direction: column; 
            align-items: center; justify-content: center; color: #fff;
            /* Fade bagian bawah header menjadi transparan agar menyatu dengan putih */
            -webkit-mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
            mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
        }

        .header img { 
            height: 16mm; 
            margin-bottom: 3mm;
            filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
        }

        .header span { 
            font-size: 9px; font-weight: 800; letter-spacing: 1.5px; 
            opacity: 0.9; text-transform: uppercase;
        }

        .photo-box {
            width: 34mm; height: 34mm; border-radius: 50%;
            border: 4px solid #fff; position: absolute;
            top: 17mm; left: 50%; transform: translateX(-50%);
            overflow: hidden; background: #fff; z-index: 10;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .photo-box img { width: 100%; height: 100%; object-fit: cover; }

        .info {
            margin-top: 22mm; text-align: center; padding: 0 4mm;
        }
        .name { font-size: 16px; font-weight: 800; color: #1a237e; margin-bottom: 4px; text-transform: uppercase; }
        .job { font-size: 10px; font-weight: 700; color: #fff; background: #1e88e5; padding: 3px 12px; border-radius: 50px; display: inline-block; margin-bottom: 12px; }

        .footer {
            position: absolute; bottom: 0; width: 100%; height: 18mm;
            background: #fafafa; border-top: 1px solid #eee;
            display: flex; align-items: center; justify-content: space-between; padding: 0 5mm; box-sizing: border-box;
        }
        .id-badge { text-align: left; }
        .id-label { font-size: 7px; color: #78909c; text-transform: uppercase; font-weight: 800; }
        .id-value { font-size: 12px; font-weight: 900; color: #263238; }
        
        .qr { width: 12mm; height: 12mm; }

        .no-print-top {
            position: fixed; top: 0; left: 0; right: 0;
            background: rgba(0,0,0,0.8); color: #fff; padding: 12px; 
            text-align: center; z-index: 999;
        }
        .btn-print { 
            background: #1e88e5; color: #fff; border: none; padding: 8px 20px; 
            border-radius: 6px; cursor: pointer; font-weight: bold;
        }
    </style>
    <script>
        // Kosongkan title sesaat sebelum dialog print terbuka
        var _origTitle = document.title;
        window.onbeforeprint = function() { document.title = ''; };
        window.onafterprint  = function() { document.title = _origTitle; };
    </script>
</head>
<body onload="window.print()">
    <div class="no-print-top no-print">
        <span style="margin-right: 15px;">Preview Name Tag - <b>{{ $user->name }}</b></span>
        <button class="btn-print" onclick="window.print()">CETAK SEKARANG</button>
    </div>

    <div class="id-card">
        <div class="header">
            <img src="{{ asset('assets/images/icon.png') }}" onerror="this.src='https://via.placeholder.com/100'">
            <span>E-SMS SYSTEM</span>
        </div>

        <div class="photo-box">
            <img src="{{ $user->foto_url ? asset($user->foto_url) : 'https://via.placeholder.com/150' }}" onerror="this.src='https://via.placeholder.com/150'">
        </div>

        <div class="info">
            <div class="name">{{ $user->name }}</div>
            <div class="job">{{ strtoupper($user->job ?? 'STAF') }}</div>
        </div>

        <div class="footer">
            <div class="id-badge">
                <div class="id-label">Employee ID</div>
                <div class="id-value">{{ $user->employee_id }}</div>
            </div>
            <div class="qr">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data={{ $user->employee_id }}" style="width:100%; height:100%;">
            </div>
        </div>
    </div>
</body>
</html>
