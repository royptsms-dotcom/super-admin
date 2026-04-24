<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cetak Name Tag - {{ $user->name }}</title>
    <style>
        @page { size: 54mm 86mm; margin: 0; }
        body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background: #f0f0f0; -webkit-print-color-adjust: exact; }
        .id-card {
            width: 54mm; height: 86mm;
            background: #fff; position: relative;
            overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);
            margin: 20px auto; border-radius: 8px;
        }
        @media print {
            body { background: none; }
            .id-card { margin: 0; box-shadow: none; }
            .no-print { display: none; }
        }
        .header {
            height: 25mm; background: linear-gradient(135deg, #4680ff, #3264d1);
            position: relative; clip-path: polygon(0 0, 100% 0, 100% 85%, 0% 100%);
            display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff;
        }
        .header img { 
            height: 12mm; margin-bottom: 2mm;
            /* Tepian logo memudar ke transparan, tengah tetap jelas */
            -webkit-mask-image: radial-gradient(circle, black 55%, transparent 80%);
            mask-image: radial-gradient(circle, black 55%, transparent 80%);
        }
        .header span { font-size: 8px; font-weight: 800; letter-spacing: 1px; }

        .photo-box {
            width: 32mm; height: 32mm; border-radius: 50%;
            border: 3px solid #fff; position: absolute;
            top: 12mm; left: 50%; transform: translateX(-50%);
            overflow: hidden; background: #e0e0e0; z-index: 10;
        }
        .photo-box img { width: 100%; height: 100%; object-fit: cover; }

        .info {
            margin-top: 22mm; text-align: center; padding: 0 5mm;
        }
        .name { font-size: 14px; font-weight: 900; color: #1e293b; margin-bottom: 4px; text-transform: uppercase; }
        .job { font-size: 9px; font-weight: 700; color: #4680ff; background: #eef2ff; padding: 3px 10px; border-radius: 50px; display: inline-block; margin-bottom: 12px; }

        .footer {
            position: absolute; bottom: 0; width: 100%; height: 15mm;
            background: #f8fafc; border-top: 1px dashed #cbd5e1;
            display: flex; align-items: center; justify-content: space-between; padding: 0 5mm; box-sizing: border-box;
        }
        .id-badge { text-align: left; }
        .id-label { font-size: 6px; color: #64748b; text-transform: uppercase; font-weight: 800; }
        .id-value { font-size: 11px; font-weight: 900; color: #334155; }
        
        .qr { width: 10mm; height: 10mm; background: #fff; padding: 1px; }

        .no-print-top {
            position: fixed; top: 0; left: 0; right: 0;
            background: #333; color: #fff; padding: 10px; text-align: center; z-index: 999;
        }
        .btn-print { background: #4680ff; color: #fff; border: none; padding: 6px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; }
    </style>
</head>
<body onload="window.print()">
    <div class="no-print-top no-print">
        Preview Name Tag - <button class="btn-print" onclick="window.print()">CETAK SEKARANG</button>
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
